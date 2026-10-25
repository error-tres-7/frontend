import snapshot from "./snapshot.json";
import type { Coordinates, Market, MarketSource } from "./types.js";

export type { Coordinates, Market, MarketSnapshot, MarketSource } from "./types.js";

/** Bundled public data only: no fetch, geolocation request, or private commerce state. */
export const markets: Market[] = snapshot.markets;
export const market_source: MarketSource = snapshot.market_source;
export const market_provenance = snapshot.provenance;

function fold_search(value: string): string {
	return value
		.normalize("NFKD")
		.replace(/\p{M}+/gu, "")
		.toLocaleLowerCase("es-MX")
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim();
}

/** All query terms must match; accents, case, punctuation, and term order do not matter. */
export function search_markets(markets: Market[], query: string): Market[] {
	const terms = fold_search(query).split(/\s+/u).filter(Boolean);
	if (!terms.length) return [...markets];
	return markets.filter((market) => {
		const searchable = fold_search([market.name, market.borough, market.neighborhood, market.address].join(" "));
		return terms.every((term) => searchable.includes(term));
	});
}

function assert_coordinates(value: Coordinates): void {
	if (
		!value ||
		typeof value.latitude !== "number" ||
		typeof value.longitude !== "number" ||
		!Number.isFinite(value.latitude) ||
		!Number.isFinite(value.longitude) ||
		Math.abs(value.latitude) > 90 ||
		Math.abs(value.longitude) > 180
	) {
		throw new RangeError("Coordinates must be finite numbers: latitude [-90, 90], longitude [-180, 180]");
	}
}

/** Great-circle distance in kilometers (mean Earth radius); not road distance or travel time. */
export function distance_km(from: Coordinates, to: Coordinates): number {
	assert_coordinates(from);
	assert_coordinates(to);
	const radians = Math.PI / 180;
	const latitude_delta = (to.latitude - from.latitude) * radians;
	const longitude_delta = (to.longitude - from.longitude) * radians;
	const haversine =
		Math.sin(latitude_delta / 2) ** 2 +
		Math.cos(from.latitude * radians) * Math.cos(to.latitude * radians) * Math.sin(longitude_delta / 2) ** 2;
	// Rounding near antipodes can put the haversine just outside [0, 1].
	return 2 * 6371.0088 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, haversine))));
}

/** Nearest first, preserving input order for ties and never mutating the caller's array. */
export function sort_markets_by_distance(markets: Market[], from: Coordinates): Market[] {
	assert_coordinates(from);
	return markets
		.map((market, index) => ({ market, index, distance: distance_km(from, market) }))
		.sort((a, b) => a.distance - b.distance || a.index - b.index)
		.map(({ market }) => market);
}
