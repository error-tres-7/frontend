import { normalize_search } from "#lib/customer/catalog.js";
import type { Product, ProductInput } from "#typing/schemas/merchants.js";

export const PRODUCT_FILTERS = [
	{ value: "all", label: "Todos los estados" },
	{ value: "available", label: "Disponible" },
	{ value: "low", label: "Pocas piezas" },
	{ value: "out", label: "Agotado" },
	{ value: "hidden", label: "Oculto" },
] as const;

export type ProductFilter = (typeof PRODUCT_FILTERS)[number]["value"];
export type ProductStatus = Exclude<ProductFilter, "all">;

export const PRODUCT_STATUS: Record<ProductStatus, { label: string; tone: "ok" | "warn" | "muted" }> = {
	available: { label: "Disponible", tone: "ok" },
	low: { label: "Pocas piezas", tone: "warn" },
	out: { label: "Agotado", tone: "muted" },
	hidden: { label: "Oculto", tone: "muted" },
};

/** Hidden wins over stock; out of stock stays visible to customers with its status. */
export function product_status(product: Product): ProductStatus {
	if (!product.visible) return "hidden";
	if (product.stock <= 0) return "out";
	if (product.stock <= product.low_stock_at) return "low";
	return "available";
}

export function filter_products(products: Product[], query: string, filter: ProductFilter) {
	const terms = normalize_search(query).split(/\s+/).filter(Boolean);
	return products.filter((product) => {
		if (filter !== "all" && product_status(product) !== filter) return false;
		const text = normalize_search(`${product.name} ${product.category}`);
		return terms.every((term) => text.includes(term));
	});
}

const number = (value: number) => String(Math.round(value * 100) / 100);

/** The editor's draft for an existing product, or an empty one. */
export function product_draft(product?: Product): ProductInput {
	return product
		? {
				name: product.name,
				category: product.category,
				unit: product.unit,
				price: product.price.toFixed(2),
				stock: number(product.stock),
				low_stock_at: number(product.low_stock_at),
				visible: product.visible,
			}
		: { name: "", category: "", unit: "kg", price: "", stock: "", low_stock_at: "", visible: true };
}
