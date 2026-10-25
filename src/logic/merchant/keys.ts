/** Query keys for merchant data; invalidate the narrowest key a write affects. */
export const merchant_keys = {
	all: ["merchant"] as const,
	profile: () => [...merchant_keys.all, "profile"] as const,
	overview: (date: string) => [...merchant_keys.all, "overview", date] as const,
	orders: (date: string) => [...merchant_keys.all, "orders", date] as const,
	products: () => [...merchant_keys.all, "products"] as const,
	references: (id: string) => [...merchant_keys.all, "references", id] as const,
	finances: (date: string) => [...merchant_keys.all, "finances", date] as const,
};
