import type { Reference } from "#typing/schemas/merchants.js";
import { round_cents } from "#utils/format.js";

/** References older than this are not current enough to suggest a price. */
export const STALE_AFTER_DAYS = 30;

function days_between(from: string, to: string) {
	return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Comparable, dated, not in the future and not stale on `today`. */
export function usable_references(references: Reference[], today: string) {
	return references.filter((reference) => {
		if (!reference.comparable) return false;
		const age = days_between(reference.as_of, today);
		return age >= 0 && age <= STALE_AFTER_DAYS;
	});
}

export type PriceStats = { median: number; min: number; max: number; count: number };

/** Median and range of usable prices; `null` when there is nothing to compare with. */
export function price_stats(prices: number[]): PriceStats | null {
	if (!prices.length) return null;
	const sorted = [...prices].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
	return { median: round_cents(median), min: sorted[0], max: sorted[sorted.length - 1], count: sorted.length };
}

export type PriceChange = { difference: number; ratio: number; direction: "up" | "down" | "same" };

/** How a proposal moves the current price: `-2` and `-0.0625` for $32 → $30. */
export function price_change(current: number, proposed: number): PriceChange {
	const difference = round_cents(proposed - current);
	return {
		difference,
		ratio: current > 0 ? difference / current : 0,
		direction: difference > 0 ? "up" : difference < 0 ? "down" : "same",
	};
}

export function position_in_range(price: number, stats: PriceStats) {
	if (price < stats.min) return "below" as const;
	if (price > stats.max) return "above" as const;
	return "within" as const;
}
