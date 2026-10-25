import { describe, expect, test } from "bun:test";
import {
	demo_merchants,
	featured_product,
	normalize_search,
	search_merchants,
	validate_contact,
	validate_name,
} from "#lib/customer/catalog.js";
import {
	cart_lines,
	cart_total,
	empty_customer,
	restore_customer,
	serialize_customer,
	set_quantity,
	toggle_favorite,
} from "#lib/customer/state.js";

function sample_cart() {
	let state = empty_customer();
	for (const [id, quantity] of [
		["jitomate", 1],
		["aguacate", 0.5],
		["cilantro", 1],
	] as const) {
		const next = set_quantity(state, "dona-lucha", id, quantity);
		if (!next) throw new Error("Sample cart rejected");
		state = next;
	}
	return state;
}

describe("illustrative customer cart", () => {
	test("approved Doña Lucha sample totals $77", () => {
		const state = sample_cart();
		expect(cart_total(state)).toBe(77);
		expect(cart_lines(state).map((line) => line.amount)).toEqual([32, 35, 10]);
		expect(state.cart).toHaveLength(3);
	});

	test("quantities replace rather than duplicate, and zero removes", () => {
		const state = sample_cart();
		const changed = set_quantity(state, "dona-lucha", "jitomate", 2);
		expect(changed?.cart).toHaveLength(3);
		expect(changed?.cart.map((item) => item.product_id)).toEqual(state.cart.map((item) => item.product_id));
		expect(changed && cart_total(changed)).toBe(109);
		const removed = set_quantity(state, "dona-lucha", "aguacate", 0);
		expect(removed?.cart).toHaveLength(2);
		expect(removed && cart_total(removed)).toBe(42);
		expect(cart_total(state)).toBe(77);
	});

	test("rejects a different merchant until replacement is explicit", () => {
		const state = sample_cart();
		expect(set_quantity(state, "huerto-pepe", "jitomate-pepe", 1)).toBeNull();
		expect(cart_total(state)).toBe(77);
		const replaced = set_quantity(state, "huerto-pepe", "jitomate-pepe", 1, true);
		expect(replaced?.merchant_id).toBe("huerto-pepe");
		expect(replaced?.cart).toHaveLength(1);
		expect(replaced && cart_total(replaced)).toBe(28);
	});

	test("removing the last item releases the cart merchant and allows re-adding from the same merchant", () => {
		const state = set_quantity(empty_customer(), "dona-lucha", "cilantro", 1);
		const emptied = state && set_quantity(state, "dona-lucha", "cilantro", 0);
		expect(emptied).toEqual(empty_customer());
		const restored = emptied && set_quantity(emptied, "dona-lucha", "aguacate", 0.5);
		expect(restored?.merchant_id).toBe("dona-lucha");
		expect(restored && cart_total(restored)).toBe(35);
	});

	test("rejects unknown products, mismatched merchants and invalid amounts", () => {
		for (const value of [-1, 0.1, 100, Number.NaN, Number.POSITIVE_INFINITY]) {
			expect(set_quantity(empty_customer(), "dona-lucha", "jitomate", value)).toBeNull();
		}
		expect(set_quantity(empty_customer(), "dona-lucha", "cilantro", 0.5)).toBeNull();
		expect(set_quantity(empty_customer(), "dona-lucha", "unknown", 1)).toBeNull();
		expect(set_quantity(empty_customer(), "unknown", "jitomate", 1)).toBeNull();
		expect(set_quantity(empty_customer(), "huerto-pepe", "jitomate", 1)).toBeNull();
	});
});

describe("customer persistence boundaries", () => {
	test("new customers do not share mutable state", () => {
		const first = toggle_favorite(empty_customer(), "dona-lucha");
		expect(first.favorites).toEqual(["dona-lucha"]);
		expect(empty_customer().favorites).toEqual([]);
		expect(toggle_favorite(first, "dona-lucha").favorites).toEqual([]);
	});

	test("round-trips only cart and favorites, never contact details", () => {
		const state = {
			...sample_cart(),
			favorites: ["medellin"],
			contact: "5512345678",
			name: "Personal name",
			pickup: "Today",
		};
		const serialized = serialize_customer(state);
		expect(serialized).not.toContain("5512345678");
		expect(serialized).not.toContain("Personal name");
		expect(serialized).not.toContain("pickup");
		expect(restore_customer(serialized)).toEqual({ ...sample_cart(), favorites: ["medellin"] });
	});

	test("invalid JSON, shapes and versions reset safely", () => {
		for (const raw of [null, "{", "null", "[]", "42", '{"version":2}', '{"version":1,"cart":{},"favorites":{}}'])
			expect(restore_customer(raw)).toEqual(empty_customer());
	});

	test("revalidates persisted quantities, IDs and duplicate lines", () => {
		const state = restore_customer(
			JSON.stringify({
				version: 1,
				favorites: ["medellin", "medellin", null, 4, ""],
				merchant_id: "dona-lucha",
				cart: [
					{ product_id: "jitomate", quantity: 1 },
					{ product_id: "jitomate", quantity: 2 },
					{ product_id: "cilantro", quantity: -1 },
					{ product_id: "invented", quantity: 1 },
					null,
				],
			})
		);
		expect(state.favorites).toEqual(["medellin"]);
		expect(state.cart).toEqual([{ product_id: "jitomate", quantity: 2 }]);
		expect(cart_total(state)).toBe(64);
		expect(
			restore_customer('{"version":1,"merchant_id":"invented","cart":[{"product_id":"jitomate","quantity":1}]}').cart
		).toEqual([]);
	});
});

describe("demo search and contact format", () => {
	test("search ignores case and accents without mutating catalog", () => {
		expect(normalize_search("  DOÑA LÚCHA ")).toBe("dona lucha");
		expect(search_merchants("jitomate")).toHaveLength(2);
		expect(search_merchants("AGUACATE").map((merchant) => merchant.id)).toEqual(["dona-lucha"]);
		expect(search_merchants("no existe")).toEqual([]);
		expect(search_merchants("  ")).toEqual(demo_merchants);
	});

	test("featured previews use the same case, accent, whitespace and token-order matching as search", () => {
		for (const query of ["aguacate hass", "aguacate  hass", "hass aguacate", "  HÁSS\tAGUACATE  "]) {
			const matches = search_merchants(query);
			expect(matches.map((merchant) => merchant.id)).toEqual(["dona-lucha"]);
			for (const merchant of matches) {
				expect(featured_product(merchant, query)?.id).toBe("aguacate");
				expect(featured_product(merchant, query)?.price).toBe(70);
			}
		}
	});

	test("featured previews support merchant terms without falling back to unrelated products", () => {
		const merchant = demo_merchants[0];
		expect(featured_product(merchant, "LÚCHA hass")?.id).toBe("aguacate");
		expect(featured_product(merchant, "")).toBe(merchant.products[0]);
		expect(featured_product(merchant, "Doña Lucha")).toBe(merchant.products[0]);
		expect(search_merchants("aguacate cilantro")).toContain(merchant);
		expect(featured_product(merchant, "aguacate cilantro")).toBeUndefined();
		expect(featured_product(merchant, "no existe")).toBeUndefined();
		expect(featured_product({ ...merchant, products: [] }, "")).toBeUndefined();
	});

	test("requires a name and a Mexican phone format, without claiming verification", () => {
		expect(validate_name(" ")).toBeDefined();
		expect(validate_name("Ana López")).toBeUndefined();
		for (const valid of ["5512345678", "55 1234 5678", "+52 55 1234 5678"])
			expect(validate_contact(valid)).toBeUndefined();
		for (const invalid of ["", "555", "a5512345678", "55123456789", "+1 5551234567"])
			expect(validate_contact(invalid)).toBeDefined();
	});
});
