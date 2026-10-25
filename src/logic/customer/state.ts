import { merchant_by_id, type Product } from "./catalog.js";

export type CartItem = { product_id: string; quantity: number };
export type CustomerSnapshot = { favorites: string[]; merchant_id: string | null; cart: CartItem[] };
export const storage_key = "entrepuestos.customer.v1";
export const empty_customer = (): CustomerSnapshot => ({ favorites: [], merchant_id: null, cart: [] });

export function valid_quantity(product: Product, quantity: number) {
	return Number.isFinite(quantity) && quantity >= 0 && quantity <= 99 && Number.isInteger(quantity / product.step);
}

export function cart_lines(state: CustomerSnapshot) {
	const merchant = merchant_by_id(state.merchant_id);
	return state.cart.flatMap((item) => {
		const product = merchant?.products.find((candidate) => candidate.id === item.product_id);
		return product
			? [{ product, quantity: item.quantity, amount: Math.round(product.price * item.quantity * 100) / 100 }]
			: [];
	});
}

export function cart_total(state: CustomerSnapshot) {
	return Math.round(cart_lines(state).reduce((total, line) => total + line.amount, 0) * 100) / 100;
}

export function set_quantity(
	state: CustomerSnapshot,
	merchant_id: string,
	product_id: string,
	quantity: number,
	replace = false
): CustomerSnapshot | null {
	const product = merchant_by_id(merchant_id)?.products.find((candidate) => candidate.id === product_id);
	if (!product || !valid_quantity(product, quantity)) return null;
	if (state.cart.length && state.merchant_id !== merchant_id && !replace) return null;
	const existing = state.merchant_id === merchant_id ? state.cart : [];
	const cart = existing.flatMap((item) =>
		item.product_id === product_id ? (quantity > 0 ? [{ product_id, quantity }] : []) : [item]
	);
	if (quantity > 0 && !existing.some((item) => item.product_id === product_id)) cart.push({ product_id, quantity });
	return { ...state, merchant_id: cart.length ? merchant_id : null, cart };
}

export function toggle_favorite(state: CustomerSnapshot, id: string): CustomerSnapshot {
	if (!id || id.length > 200) return state;
	return {
		...state,
		favorites: state.favorites.includes(id)
			? state.favorites.filter((value) => value !== id)
			: [...state.favorites, id],
	};
}

export function restore_customer(raw: string | null): CustomerSnapshot {
	const initial = empty_customer();
	if (!raw) return initial;
	try {
		const stored: unknown = JSON.parse(raw);
		if (!stored || typeof stored !== "object" || !("version" in stored) || stored.version !== 1) return initial;
		const data = stored as Record<string, unknown>;
		if (Array.isArray(data.favorites))
			initial.favorites = [
				...new Set(
					data.favorites.filter((id): id is string => typeof id === "string" && id.length > 0 && id.length <= 200)
				),
			].slice(0, 500);
		const merchant = typeof data.merchant_id === "string" ? merchant_by_id(data.merchant_id) : undefined;
		if (merchant && Array.isArray(data.cart)) {
			for (const item of data.cart) {
				if (
					!item ||
					typeof item !== "object" ||
					typeof item.product_id !== "string" ||
					typeof item.quantity !== "number"
				)
					continue;
				const next = set_quantity(initial, merchant.id, item.product_id, item.quantity);
				if (next) Object.assign(initial, next);
			}
		}
		return initial;
	} catch {
		return initial;
	}
}

export function serialize_customer(state: CustomerSnapshot) {
	// Explicit allowlist: contact and pickup drafts must never enter browser storage.
	return JSON.stringify({ version: 1, favorites: state.favorites, merchant_id: state.merchant_id, cart: state.cart });
}
