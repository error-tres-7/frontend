import { finances, orders, products, stall } from "#services/merchants/index.js";
import { merchant_keys } from "./keys.js";

/** Query options shared by every component that reads the same merchant data. */
export const merchant_queries = {
	profile: () => ({
		queryKey: merchant_keys.profile(),
		queryFn: ({ signal }: { signal: AbortSignal }) => stall.profile({ signal }),
	}),
	overview: (date: string) => ({
		queryKey: merchant_keys.overview(date),
		queryFn: ({ signal }: { signal: AbortSignal }) => stall.overview({ params: { date }, signal }),
	}),
	orders: (date: string) => ({
		queryKey: merchant_keys.orders(date),
		queryFn: ({ signal }: { signal: AbortSignal }) => orders.list({ params: { date }, signal }),
	}),
	products: () => ({
		queryKey: merchant_keys.products(),
		queryFn: ({ signal }: { signal: AbortSignal }) => products.list({ signal }),
	}),
	references: (id: string) => ({
		queryKey: merchant_keys.references(id),
		queryFn: ({ signal }: { signal: AbortSignal }) => products.references({ body: { id }, signal }),
	}),
	finances: (date: string) => ({
		queryKey: merchant_keys.finances(date),
		queryFn: ({ signal }: { signal: AbortSignal }) => finances.day({ params: { date }, signal }),
	}),
};
