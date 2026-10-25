import type { Market } from "./types.js";

const lower_case_words = new Set([
	"a",
	"al",
	"con",
	"de",
	"del",
	"e",
	"el",
	"en",
	"entre",
	"hasta",
	"la",
	"las",
	"los",
	"o",
	"para",
	"por",
	"sin",
	"sobre",
	"y",
]);
const acronyms = new Set(["cdmx", "ctm", "ffcc", "imss", "ipn", "issste", "pemex", "uam", "unam", "s/n"]);
const roman_numerals = new Set([
	"i",
	"ii",
	"iii",
	"iv",
	"v",
	"vi",
	"vii",
	"viii",
	"ix",
	"x",
	"xi",
	"xii",
	"xiii",
	"xiv",
	"xv",
	"xvi",
	"xvii",
	"xviii",
	"xix",
	"xx",
]);
const missing_stalls = new Set(["", "-", "n/d", "s/d", "n/a", "nd", "na", "sin dato", "sin datos"]);

function record(value: unknown, field: string): Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw new TypeError(`${field} must be an object`);
	}
	return value as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
	if (typeof value !== "string") throw new TypeError(`${field} must be a non-empty string`);
	const result = value.normalize("NFC").replace(/\s+/gu, " ").trim();
	if (!result || /\p{Cc}/u.test(result))
		throw new TypeError(`${field} must be non-empty text without control characters`);
	return result;
}

/** Casing only: never guess missing accents, expand abbreviations, or correct source names. */
export function title_case_display(value: string): string {
	const input = text(value, "Display name").toLocaleLowerCase("es-MX");
	return input.replace(/[\p{L}\p{N}]+(?:[./][\p{L}\p{N}]+)*\.?/gu, (word, offset: number) => {
		if (acronyms.has(word) || roman_numerals.has(word) || /^\p{L}(?:\.\p{L})+\.?$/u.test(word)) {
			return word.toLocaleUpperCase("es-MX");
		}
		if (/^\d/u.test(word)) return word;
		const starts_phrase = !input.slice(0, offset).trim() || /[(:]\s*$/u.test(input.slice(0, offset));
		if (!starts_phrase && lower_case_words.has(word)) return word;
		return word.charAt(0).toLocaleUpperCase("es-MX") + word.slice(1);
	});
}

function integer(value: unknown, field: string, minimum = Number.MIN_SAFE_INTEGER): number {
	const number = typeof value === "string" && /^-?\d+(?:\.0+)?$/u.test(value.trim()) ? Number(value.trim()) : value;
	if (typeof number !== "number" || !Number.isSafeInteger(number) || number < minimum) {
		throw new TypeError(`${field} must be a safe integer >= ${minimum}`);
	}
	return number;
}

function official_number(value: unknown, field: string): number {
	const number = typeof value === "string" && /^-?\d+(?:\.\d+)?$/u.test(value.trim()) ? Number(value.trim()) : value;
	// NUM_OFIC contains signed numbers and a literal 0.394; preserve it rather than inventing a correction.
	if (typeof number !== "number" || !Number.isFinite(number) || Math.abs(number) > Number.MAX_SAFE_INTEGER) {
		throw new TypeError(`${field} must be a finite numeric identifier within the safe number range`);
	}
	return number;
}

function stalls(value: unknown, field: string): number | null {
	if (value === null || value === undefined) return null;
	if (typeof value === "string" && missing_stalls.has(value.trim().toLocaleLowerCase("es-MX"))) return null;
	return integer(value, field, 0);
}

function point(value: unknown, field: string): { latitude: number; longitude: number } {
	const geometry = record(value, field);
	const coordinates = geometry.coordinates;
	if (
		geometry.type !== "Point" ||
		!Array.isArray(coordinates) ||
		(coordinates.length !== 2 && coordinates.length !== 3) ||
		!Array.from(coordinates).every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate))
	) {
		throw new TypeError(`${field} must be a Point with two or three finite numeric coordinates`);
	}
	const [longitude, latitude] = coordinates as number[];
	// A conservative CDMX sanity envelope, not an administrative boundary polygon.
	if (longitude < -99.5 || longitude > -98.8 || latitude < 18.9 || latitude > 19.7) {
		throw new RangeError(`${field} is outside the CDMX envelope; expected GeoJSON [longitude, latitude]`);
	}
	return { latitude, longitude };
}

/** Validate the entire GeoJSON or throw; never skip broken rows or substitute fixtures. */
export function normalize_markets(input: unknown): Market[] {
	const collection = record(input, "GeoJSON");
	if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features) || !collection.features.length) {
		throw new TypeError("GeoJSON must be a non-empty FeatureCollection");
	}
	if (collection.crs !== undefined) {
		const crs = record(collection.crs, "GeoJSON.crs");
		const properties = record(crs.properties, "GeoJSON.crs.properties");
		if (
			crs.type !== "name" ||
			typeof properties.name !== "string" ||
			!["urn:ogc:def:crs:OGC:1.3:CRS84", "urn:ogc:def:crs:EPSG::4326", "EPSG:4326"].includes(properties.name)
		) {
			throw new TypeError("GeoJSON.crs must describe geographic WGS84 coordinates");
		}
	}
	const ids = new Set<string>();
	const identities = new Set<string>();
	const result = Array.from(collection.features, (value: unknown, index: number): Market => {
		const field = `features[${index}]`;
		const feature = record(value, field);
		if (feature.type !== "Feature") throw new TypeError(`${field}.type must be Feature`);
		const properties = record(feature.properties, `${field}.properties`);
		const source_number = integer(properties["N°"], `${field}.properties.N°`, 0);
		const official = official_number(properties.NUM_OFIC, `${field}.properties.NUM_OFIC`);
		// Neither field is unique alone. Always use both, including zero, signed, and decimal source numbers.
		const id = `sedeco-${source_number}-${official}`;
		if (ids.has(id)) throw new TypeError(`${field}: duplicate market ID ${id}`);
		ids.add(id);
		const market: Market = {
			id,
			name: title_case_display(text(properties.MERCADO, `${field}.properties.MERCADO`)),
			borough: title_case_display(text(properties.DELEGACION, `${field}.properties.DELEGACION`)),
			neighborhood: title_case_display(text(properties.COLONIA, `${field}.properties.COLONIA`)),
			address: title_case_display(text(properties.DIRECCION, `${field}.properties.DIRECCION`)),
			...point(feature.geometry, `${field}.geometry`),
			stalls: stalls(properties.NUM_LOCALE, `${field}.properties.NUM_LOCALE`),
		};
		const identity = JSON.stringify([market.name, market.borough, market.address, market.latitude, market.longitude]);
		if (identities.has(identity)) throw new TypeError(`${field}: duplicate market record ${market.name}`);
		identities.add(identity);
		return market;
	});
	// Source ordering may change; source numbering, not array positions or names, determines identity and order.
	return result.sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
}
