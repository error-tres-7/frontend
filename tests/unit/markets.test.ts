import { describe, expect, test } from "bun:test";
import { DOWNLOAD_TIMEOUT_MS, download_market_snapshot, MAX_DOWNLOAD_BYTES } from "#lib/markets/import.js";
import {
	distance_km,
	market_provenance,
	market_source,
	markets,
	search_markets,
	sort_markets_by_distance,
} from "#lib/markets/index.js";
import { normalize_markets, title_case_display } from "#lib/markets/normalize.js";
import { SEDECO_SOURCE } from "#lib/markets/source.js";
import type { Coordinates, Market } from "#lib/markets/types.js";

function feature(number = 1) {
	return {
		type: "Feature",
		properties: {
			"N°": number,
			NUM_OFIC: number + 1000,
			MERCADO: `MERCADO ${number}`,
			DELEGACION: "CUAUHTÉMOC",
			COLONIA: "CENTRO",
			DIRECCION: `CALLE ${number} S/N`,
			NUM_LOCALE: 42,
		},
		geometry: { type: "Point", coordinates: [-99.1332, 19.4326, 0] },
	};
}

function collection(features: unknown[] = [feature()]) {
	return { type: "FeatureCollection", features };
}

function normalize_feature(properties: Record<string, unknown> = {}, geometry: unknown = feature().geometry) {
	const value = feature();
	return normalize_markets(collection([{ ...value, properties: { ...value.properties, ...properties }, geometry }]));
}

const test_markets: Market[] = [
	{
		id: "near",
		name: "San Juan",
		borough: "Cuauhtémoc",
		neighborhood: "Centro",
		address: "Ernesto Pugibet S/N",
		latitude: 19.4326,
		longitude: -99.1332,
		stalls: null,
	},
	{
		id: "far",
		name: "Portales II",
		borough: "Benito Juárez",
		neighborhood: "Álamos",
		address: "Avenida 5 de Mayo",
		latitude: 19.3626,
		longitude: -99.1432,
		stalls: 100,
	},
];

const origin = { latitude: 19.4326, longitude: -99.1332 };

describe("bundled SEDECO snapshot", () => {
	test("exports the integration contract with the complete verified inventory, not fixtures", () => {
		expect(markets).toHaveLength(329);
		expect(new Set(markets.map((market) => market.id)).size).toBe(329);
		expect(new Set(markets.map((market) => market.borough)).size).toBe(16);
		for (const market of markets) {
			expect(Object.keys(market).sort()).toEqual([
				"address",
				"borough",
				"id",
				"latitude",
				"longitude",
				"name",
				"neighborhood",
				"stalls",
			]);
			expect(market.id).toMatch(/^sedeco-\d+--?\d+(?:\.\d+)?$/u);
			for (const text of [market.name, market.borough, market.neighborhood, market.address]) {
				expect(text).not.toBe("");
				expect(text).toBe(text.normalize("NFC").trim());
				expect(text).not.toMatch(/\s{2,}/u);
			}
			expect(market.longitude).toBeGreaterThanOrEqual(-99.5);
			expect(market.longitude).toBeLessThanOrEqual(-98.8);
			expect(market.latitude).toBeGreaterThanOrEqual(18.9);
			expect(market.latitude).toBeLessThanOrEqual(19.7);
			expect(market.stalls === null || (Number.isSafeInteger(market.stalls) && market.stalls >= 0)).toBe(true);
		}
	});

	test("preserves a known source Point in longitude/latitude order", () => {
		expect(markets.find((market) => market.id === "sedeco-18-35")).toEqual({
			id: "sedeco-18-35",
			name: "Azcapotzalco",
			borough: "Azcapotzalco",
			neighborhood: "Azcapotzalco",
			address: "Av. Azcapotzalco entre Esperanza y Rayon",
			latitude: 19.482871914660596,
			longitude: -99.1854389999357,
			stalls: 546,
		});
	});

	test("retains ambiguous and unusual source identifiers without invented corrections", () => {
		expect(markets.find((market) => market.id === "sedeco-246-254")?.borough).toBe("Tláhuac");
		expect(markets.find((market) => market.id === "sedeco-246-289")?.borough).toBe("Tlalpan");
		expect(markets.find((market) => market.id === "sedeco-0-136")?.name).toBe("Providencia");
		expect(markets.find((market) => market.id === "sedeco-76--378")?.name).toBe("Huizachito");
		expect(markets.find((market) => market.id === "sedeco-274-0.394")?.name).toBe("Veinticuatro de Febrero");
	});

	test("includes attribution, the original byte checksum, transformations, and retrieval time", () => {
		expect(market_source.url).toBe(SEDECO_SOURCE.url);
		expect(market_source.title).toBe("Mercados públicos");
		expect(market_source.license).toBe("CC-BY-4.0-ESP");
		expect(new Date(market_source.imported_at).toISOString()).toBe(market_source.imported_at);
		expect(market_provenance.publisher).toBe(SEDECO_SOURCE.publisher);
		expect(market_provenance.download_url).toBe(SEDECO_SOURCE.download_url);
		expect(market_provenance.resource_id).toBe(SEDECO_SOURCE.resource_id);
		expect(market_provenance.sha256).toBe("d88a0f9c81bb54ca9307a8c48c0cfcef3658bf70f62d58602a672a395212c8bb");
		expect(market_provenance.feature_count).toBe(markets.length);
		expect(market_provenance.normalization_version).toBe(1);
		expect(market_provenance.id_fields).toEqual(["N°", "NUM_OFIC"]);
		expect(market_provenance.field_mapping.latitude).toBe("geometry.coordinates[1]");
		expect(market_provenance.field_mapping.longitude).toBe("geometry.coordinates[0]");
		expect(market_provenance.notes.join(" ")).toContain("source spellings");
		expect(market_provenance.notes.join(" ")).toContain("not the observation date");
	});
});

describe("source normalization", () => {
	test("normalizes text, numeric strings, and GeoJSON altitude without mutating input", () => {
		const input = collection([feature()]);
		const before = structuredClone(input);
		expect(normalize_markets(input)[0]).toEqual({
			id: "sedeco-1-1001",
			name: "Mercado 1",
			borough: "Cuauhtémoc",
			neighborhood: "Centro",
			address: "Calle 1 S/N",
			latitude: 19.4326,
			longitude: -99.1332,
			stalls: 42,
		});
		expect(input).toEqual(before);
		expect(normalize_feature({ "N°": " 001.0 ", NUM_OFIC: "-378.0", NUM_LOCALE: " 42.0 " })[0]).toMatchObject({
			id: "sedeco-1--378",
			stalls: 42,
		});
		expect(normalize_feature({}, { type: "Point", coordinates: [-99.13, 19.43] })[0]).toMatchObject({
			latitude: 19.43,
			longitude: -99.13,
		});
	});

	test.each([
		["  SAN\tJUAN  DE\nARAGÓN (UNIDAD II) ", "San Juan de Aragón (Unidad II)"],
		["ÁLVARO OBREGÓN", "Álvaro Obregón"],
		["BENITO JUA\u0301REZ", "Benito Juárez"],
		["MARGARITA MAZA DE JUAREZ", "Margarita Maza de Juarez"],
		["AV. 5 DE MAYO S/N", "Av. 5 de Mayo S/N"],
		["GUSTAVO A. MADERO", "Gustavo A. Madero"],
		["C.T.M. UNAM CDMX", "C.T.M. UNAM CDMX"],
		["ARENAL 4a SECCION", "Arenal 4a Seccion"],
	])("uses thoughtful display casing: %s", (input, expected) => {
		expect(title_case_display(input)).toBe(expected);
	});

	test("uses source identity, not mutable names, coordinates, or array order", () => {
		const input = collection([feature(2), feature(1)]);
		const forward = normalize_markets(input);
		const reverse = normalize_markets(collection([...input.features].reverse()));
		expect(forward).toEqual(reverse);
		expect(normalize_feature({ MERCADO: "RENOMBRADO" })[0].id).toBe(forward[0].id);
		expect(normalize_feature({}, { type: "Point", coordinates: [-99.2, 19.4] })[0].id).toBe(forward[0].id);
		expect(normalize_feature({ NUM_OFIC: 0.394 })[0].id).toBe("sedeco-1-0.394");
	});

	test("rejects duplicate IDs and duplicate records even with changed numbering", () => {
		const first = feature();
		expect(() => normalize_markets(collection([first, first]))).toThrow("duplicate market ID sedeco-1-1001");
		const renamed = { ...first, properties: { ...first.properties, MERCADO: "OTRO" } };
		expect(() => normalize_markets(collection([first, renamed]))).toThrow("duplicate market ID");
		const renumbered = { ...first, properties: { ...first.properties, "N°": 2 } };
		expect(() => normalize_markets(collection([first, renumbered]))).toThrow("duplicate market record");
	});

	test("allows the verified individual-number collisions and similarly named markets", () => {
		const first = feature(246);
		const second = feature(246);
		second.properties.NUM_OFIC = 289;
		second.properties.DELEGACION = "TLALPAN";
		expect(normalize_markets(collection([first, second]))).toHaveLength(2);
		const third = feature(247);
		third.properties.NUM_OFIC = first.properties.NUM_OFIC;
		expect(normalize_markets(collection([first, third]))).toHaveLength(2);
	});

	test.each([undefined, null, "", "  ", "N/D", "S/D", "N/A", "ND", "-", "Sin datos"])(
		"uses null for an explicitly missing stall count: %s",
		(value) => expect(normalize_feature({ NUM_LOCALE: value })[0].stalls).toBeNull()
	);

	test("preserves a reported zero stall count", () => {
		expect(normalize_feature({ NUM_LOCALE: 0 })[0].stalls).toBe(0);
	});

	test.each([
		-1,
		2.5,
		Number.NaN,
		Number.POSITIVE_INFINITY,
		"12 puestos",
		"1,000",
		{},
		false,
		Number.MAX_SAFE_INTEGER + 1,
	])("rejects malformed stall counts instead of treating them as missing: %s", (value) =>
		expect(() => normalize_feature({ NUM_LOCALE: value })).toThrow("NUM_LOCALE")
	);

	test.each(
		[
			undefined,
			null,
			{},
			[],
			"FeatureCollection",
			{ type: "FeatureCollection", features: [] },
			{ type: "FeatureCollection", features: {} },
			{ type: "Feature", features: [feature()] },
		].map((value) => [value])
	)("rejects unknown or empty collection shapes: %j", (value) => expect(() => normalize_markets(value)).toThrow());

	test.each(
		[
			undefined,
			null,
			[],
			{},
			{ type: "Point" },
			{ type: "Feature", properties: null },
			{ ...feature(), type: "Point" },
		].map((value) => [value])
	)("rejects malformed features: %j", (value) => {
		expect(() => normalize_markets(collection([value]))).toThrow("features[0]");
	});

	test.each(["MERCADO", "DELEGACION", "COLONIA", "DIRECCION"])("rejects missing or malformed required %s", (field) => {
		for (const value of [undefined, null, " \n ", 123, {}, "BAD\u0000TEXT"]) {
			expect(() => normalize_feature({ [field]: value })).toThrow(field);
		}
	});

	test("rejects missing or malformed source identity fields", () => {
		for (const value of [null, undefined, "", "N/D", false, {}, Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(() => normalize_feature({ "N°": value })).toThrow("N°");
			expect(() => normalize_feature({ NUM_OFIC: value })).toThrow("NUM_OFIC");
		}
		for (const value of [-1, 1.5, "1.5", Number.MAX_SAFE_INTEGER + 1]) {
			expect(() => normalize_feature({ "N°": value })).toThrow("N°");
		}
		expect(() => normalize_feature({ NUM_OFIC: Number.MAX_SAFE_INTEGER + 1 })).toThrow("NUM_OFIC");
	});

	test.each([
		null,
		{},
		{ type: "Polygon", coordinates: [] },
		{ type: "Point", coordinates: [19.43, -99.13] },
		{ type: "Point", coordinates: [0, 0] },
		{ type: "Point", coordinates: [-181, 19.43] },
		{ type: "Point", coordinates: [-99.13, 91] },
		{ type: "Point", coordinates: [-99.13, -19.43] },
		{ type: "Point", coordinates: [480539, 2154268] },
		{ type: "Point", coordinates: ["-99.13", 19.43] },
		{ type: "Point", coordinates: [-99.13, Number.NaN] },
		{ type: "Point", coordinates: [-99.13, Number.POSITIVE_INFINITY] },
		{ type: "Point", coordinates: [-99.13] },
		{ type: "Point", coordinates: [-99.13, 19.43, 0, 0] },
		{ type: "Point", coordinates: [-99.13, 19.43, null] },
		{ type: "Point", coordinates: new Array(2) },
	])("rejects bad, swapped, projected, and out-of-area coordinates: %j", (geometry) => {
		expect(() => normalize_feature({}, geometry)).toThrow("geometry");
	});

	test("rejects sparse feature collections and the entire import when any row is invalid", () => {
		expect(() => normalize_markets(collection(new Array(2)))).toThrow("features[0]");
		expect(() => normalize_markets(collection([feature(), null]))).toThrow("features[1]");
	});

	test("accepts only absent or explicitly geographic WGS84 CRS", () => {
		const input = collection();
		for (const name of ["urn:ogc:def:crs:OGC:1.3:CRS84", "urn:ogc:def:crs:EPSG::4326", "EPSG:4326"]) {
			expect(normalize_markets({ ...input, crs: { type: "name", properties: { name } } })).toHaveLength(1);
		}
		for (const crs of [
			null,
			{},
			{ type: "name", properties: { name: "EPSG:3857" } },
			{ type: "name", properties: { name: ["EPSG:4326"] } },
		]) {
			expect(() => normalize_markets({ ...input, crs })).toThrow("crs");
		}
	});
});

describe("market search", () => {
	test.each(["juarez", "JUÁREZ", "jua\u0301rez", "  Juarez  ", "juárez,", "portales alamos", "MAYO BENITO"])(
		"folds case, accents, punctuation, and whitespace across all location fields: %s",
		(query) => expect(search_markets(test_markets, query).map((market) => market.id)).toEqual(["far"])
	);

	test("matches names, neighborhoods, and addresses, requiring every term", () => {
		expect(search_markets(test_markets, "san juan centro pugibet")).toEqual([test_markets[0]]);
		expect(search_markets(test_markets, "san portales")).toEqual([]);
		expect(search_markets(test_markets, "no existe")).toEqual([]);
		expect(search_markets([], "juarez")).toEqual([]);
	});

	test.each(["", "  \n\t ", "--- , .", "\u0301"])(
		"returns an independent array for an empty folded query: %s",
		(query) => {
			const found = search_markets(test_markets, query);
			expect(found).toEqual(test_markets);
			expect(found).not.toBe(test_markets);
		}
	);

	test("preserves input order and leaves source names and arrays untouched", () => {
		const before = structuredClone(test_markets);
		expect(search_markets(test_markets, "a")).toEqual(test_markets);
		expect(test_markets).toEqual(before);
		expect(search_markets(markets, "CUAUHTEMOC").length).toBeGreaterThan(20);
	});
});

describe("Haversine distance and nearest-market ordering", () => {
	test("uses kilometers, is symmetric, and returns zero for identical points", () => {
		const london = { latitude: 51.5074, longitude: -0.1278 };
		const paris = { latitude: 48.8566, longitude: 2.3522 };
		expect(distance_km(london, paris)).toBeCloseTo(343.557, 2);
		expect(distance_km(london, paris)).toBe(distance_km(paris, london));
		expect(distance_km(origin, origin)).toBe(0);
		expect(distance_km({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 })).toBeCloseTo(111.195, 2);
	});

	test("handles antipodes, poles, and antimeridian crossings without NaN", () => {
		expect(distance_km({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 })).toBeCloseTo(
			Math.PI * 6371.0088,
			8
		);
		expect(distance_km({ latitude: 90, longitude: 0 }, { latitude: -90, longitude: 0 })).toBeCloseTo(
			Math.PI * 6371.0088,
			8
		);
		expect(distance_km({ latitude: 0, longitude: 179.9 }, { latitude: 0, longitude: -179.9 })).toBeCloseTo(22.239, 2);
	});

	test.each([
		{ latitude: Number.NaN, longitude: -99 },
		{ latitude: 19, longitude: Number.POSITIVE_INFINITY },
		{ latitude: 91, longitude: 0 },
		{ latitude: -91, longitude: 0 },
		{ latitude: 19, longitude: 181 },
		{ latitude: 19, longitude: -181 },
		{ latitude: "19", longitude: -99 },
		null,
	])("rejects invalid coordinates on either side: %j", (value) => {
		const invalid = value as unknown as Coordinates;
		expect(() => distance_km(origin, invalid)).toThrow("Coordinates");
		expect(() => distance_km(invalid, origin)).toThrow("Coordinates");
	});

	test("sorts nearest first with stable ties without mutating the input", () => {
		const tied = { ...test_markets[0], id: "tied" };
		const input = [test_markets[1], tied, test_markets[0]];
		const before = structuredClone(input);
		const sorted = sort_markets_by_distance(input, origin);
		expect(sorted.map((market) => market.id)).toEqual(["tied", "near", "far"]);
		expect(sorted).not.toBe(input);
		expect(input).toEqual(before);
		expect(sort_markets_by_distance([], origin)).toEqual([]);
		expect(() => sort_markets_by_distance([], { latitude: 100, longitude: 0 })).toThrow("Coordinates");
	});
});

describe("automatic import (network mocked, no snapshot writes)", () => {
	test("fetches only the verified resource, enforces a deadline, and hashes original response bytes", async () => {
		const input = collection(Array.from({ length: 329 }, (_, index) => feature(index)));
		const body = `${JSON.stringify(input)}\n`;
		const expected_hash = new Bun.CryptoHasher("sha256").update(body).digest("hex");
		let requests = 0;
		const started = Date.now();
		const snapshot = await download_market_snapshot({
			fetcher: async (url, options) => {
				requests += 1;
				expect(url).toBe(SEDECO_SOURCE.download_url);
				expect(options.redirect).toBe("error");
				expect(options.signal).toBeInstanceOf(AbortSignal);
				expect(options.signal?.aborted).toBe(false);
				expect(options.headers).toEqual({ Accept: "application/geo+json, application/json" });
				return new Response(body);
			},
			now: () => new Date("2026-10-25T12:34:56.000Z"),
		});
		expect(Date.now() - started).toBeLessThan(DOWNLOAD_TIMEOUT_MS);
		expect(requests).toBe(1);
		expect(snapshot.markets).toEqual(normalize_markets(input));
		expect(snapshot.provenance.sha256).toBe(expected_hash);
		expect(snapshot.provenance.feature_count).toBe(329);
		expect(snapshot.market_source.imported_at).toBe("2026-10-25T12:34:56.000Z");
	});

	test("propagates network failures instead of substituting the bundled snapshot", async () => {
		await expect(
			download_market_snapshot({
				fetcher: async () => {
					throw new Error("offline");
				},
			})
		).rejects.toThrow("offline");
	});

	test("rejects non-success HTTP status, missing bodies, invalid JSON, and invalid UTF-8", async () => {
		for (const [response, message] of [
			[new Response("unavailable", { status: 503 }), "HTTP 503"],
			[new Response(null), "empty response body"],
			[new Response("<html>Not JSON</html>"), "not valid UTF-8 JSON"],
			[new Response(new Uint8Array([0xff])), "not valid UTF-8 JSON"],
		] as const) {
			await expect(download_market_snapshot({ fetcher: async () => response })).rejects.toThrow(message);
		}
	});

	test("rejects unexpected record counts and malformed rows without returning partial data", async () => {
		for (const count of [1, 328, 330]) {
			const body = JSON.stringify(collection(Array.from({ length: count }, (_, index) => feature(index))));
			await expect(download_market_snapshot({ fetcher: async () => new Response(body) })).rejects.toThrow(
				"Expected 329"
			);
		}
		const body = JSON.stringify(collection([feature(), null]));
		await expect(download_market_snapshot({ fetcher: async () => new Response(body) })).rejects.toThrow("features[1]");
	});

	test("rejects oversized downloads both with and without Content-Length", async () => {
		const advertised = new Response("{}", { headers: { "content-length": String(MAX_DOWNLOAD_BYTES + 1) } });
		await expect(download_market_snapshot({ fetcher: async () => advertised })).rejects.toThrow("exceeds");
		const body = new Uint8Array(MAX_DOWNLOAD_BYTES + 1);
		await expect(download_market_snapshot({ fetcher: async () => new Response(body) })).rejects.toThrow("exceeds");
	});

	test("propagates interrupted response streams", async () => {
		const stream = new ReadableStream<Uint8Array>({
			start(controller) {
				controller.error(new Error("connection interrupted"));
			},
		});
		await expect(download_market_snapshot({ fetcher: async () => new Response(stream) })).rejects.toThrow(
			"connection interrupted"
		);
	});
});
