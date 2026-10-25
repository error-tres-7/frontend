import { normalize_markets } from "./normalize.js";
import { SEDECO_SOURCE } from "./source.js";
import type { MarketSnapshot } from "./types.js";

export const MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024;
export const DOWNLOAD_TIMEOUT_MS = 30_000;

type ImportOptions = {
	fetcher?: (url: string, options: RequestInit) => Promise<Response>;
	now?: () => Date;
};

async function read_download(response: Response): Promise<Uint8Array<ArrayBuffer>> {
	const content_length = response.headers.get("content-length");
	if (content_length !== null && Number(content_length) > MAX_DOWNLOAD_BYTES) {
		await response.body?.cancel();
		throw new Error(`SEDECO download exceeds ${MAX_DOWNLOAD_BYTES} bytes`);
	}
	if (!response.body) throw new Error("SEDECO returned an empty response body");
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let length = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			length += value.byteLength;
			if (length > MAX_DOWNLOAD_BYTES) {
				await reader.cancel();
				throw new Error(`SEDECO download exceeds ${MAX_DOWNLOAD_BYTES} bytes`);
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	const bytes = new Uint8Array(length);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return bytes;
}

/** Import-time network only. Errors propagate; the existing bundled snapshot is never a fallback. */
export async function download_market_snapshot(options: ImportOptions = {}): Promise<MarketSnapshot> {
	const response = await (options.fetcher ?? fetch)(SEDECO_SOURCE.download_url, {
		headers: { Accept: "application/geo+json, application/json" },
		signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
		redirect: "error",
	});
	if (!response.ok) {
		await response.body?.cancel();
		throw new Error(`SEDECO download failed: HTTP ${response.status} ${response.statusText}`);
	}
	const bytes = await read_download(response);
	let input: unknown;
	try {
		input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
	} catch (cause) {
		throw new Error("SEDECO download is not valid UTF-8 JSON", { cause });
	}
	const markets = normalize_markets(input);
	if (markets.length !== SEDECO_SOURCE.expected_feature_count) {
		throw new Error(
			`Expected ${SEDECO_SOURCE.expected_feature_count} SEDECO features, received ${markets.length}; review upstream changes before updating the snapshot`
		);
	}
	const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
	const sha256 = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
	return {
		market_source: {
			url: SEDECO_SOURCE.url,
			title: SEDECO_SOURCE.title,
			license: SEDECO_SOURCE.license,
			imported_at: (options.now?.() ?? new Date()).toISOString(),
		},
		provenance: {
			publisher: SEDECO_SOURCE.publisher,
			download_url: SEDECO_SOURCE.download_url,
			resource_id: SEDECO_SOURCE.resource_id,
			sha256,
			feature_count: markets.length,
			normalization_version: 1,
			id_fields: ["N°", "NUM_OFIC"],
			field_mapping: {
				id: "sedeco-{N°}-{NUM_OFIC}",
				name: "MERCADO",
				borough: "DELEGACION",
				neighborhood: "COLONIA",
				address: "DIRECCION",
				longitude: "geometry.coordinates[0]",
				latitude: "geometry.coordinates[1]",
				stalls: "NUM_LOCALE",
			},
			notes: [
				"Attribution: Mercados públicos — Secretaría de Desarrollo Económico (SEDECO), Portal de Datos Abiertos de la Ciudad de México; CC-BY-4.0-ESP.",
				"Changes: NFC/whitespace normalization and Spanish display casing; source spellings and missing accents are not corrected. Geographic coordinates are preserved; altitude is omitted.",
				"N° and NUM_OFIC each contain duplicates. Their pair is unique; IDs always use both, preserving zero, signed numbers, and the source's literal NUM_OFIC 0.394. Records are sorted by ID, not source position.",
				"Missing NUM_LOCALE becomes null, not zero. Other malformed values, duplicate IDs/records, non-WGS84 CRS, and coordinates outside a conservative CDMX envelope are rejected.",
				"imported_at records retrieval, not the observation date. This inventory does not verify current operation, opening hours, payments, products, or live stall availability.",
			],
		},
		markets,
	};
}
