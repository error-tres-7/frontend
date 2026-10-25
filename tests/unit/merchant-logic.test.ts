import { describe, expect, test } from "bun:test";
import { quantity } from "#lib/merchant/labels.js";
import { change_due, count_in, orders_in, reached_step, tab_of } from "#lib/merchant/orders.js";
import { position_in_range, price_change, price_stats, usable_references } from "#lib/merchant/prices.js";
import { filter_products, product_draft, product_status } from "#lib/merchant/products.js";
import type { Order, Product, Reference } from "#typing/schemas/merchants.js";
import { iso_day, mxn, percent, round_cents, signed_mxn } from "#utils/format.js";

const reference = (price: number, as_of = "2026-10-25", comparable = true): Reference => ({
	id: `${price}-${as_of}`,
	market: "Jamaica",
	label: "Ejemplo A",
	price,
	source: "Ficha simulada",
	as_of,
	comparable,
});

describe("price references", () => {
	test("design example: $28, $30, $34 give a $30 median within the $28–$34 range", () => {
		const stats = price_stats([34, 28, 30]);
		expect(stats).toEqual({ median: 30, min: 28, max: 34, count: 3 });
		expect(stats && position_in_range(32, stats)).toBe("within");
	});

	test("even counts average the two middle prices", () => {
		expect(price_stats([28, 30, 31, 34])?.median).toBe(30.5);
	});

	test("nothing to compare means no suggestion", () => {
		expect(price_stats([])).toBeNull();
	});

	test("only comparable, current references are used", () => {
		const today = "2026-10-25";
		const usable = usable_references(
			[
				reference(28),
				reference(30, "2026-09-25"),
				reference(31, "2026-09-24"),
				reference(32, "2026-10-26"),
				reference(33, today, false),
			],
			today
		);
		expect(usable.map((item) => item.price)).toEqual([28, 30]);
	});

	test("$32 → $30 is a $2 drop, −6.25%", () => {
		const change = price_change(32, 30);
		expect(change).toEqual({ difference: -2, ratio: -0.0625, direction: "down" });
		expect(percent(change.ratio)).toBe("−6.25%");
	});

	test("an unchanged price is not a change", () => {
		expect(price_change(32, 32).direction).toBe("same");
	});
});

const order = (id: string, status: Order["status"], from: string): Order => ({
	id,
	number: id,
	customer_name: "Ana López",
	pickup: { from, to: from },
	total: 77,
	note: null,
	status,
	items: [],
	payment: null,
	created_at: "2026-10-25T10:00:00-06:00",
});

describe("orders", () => {
	const all = [
		order("043", "pending", "13:30"),
		order("041", "pending", "12:30"),
		order("040", "ready", "12:00"),
		order("039", "delivered", "11:30"),
		order("038", "cancelled", "11:00"),
	];

	test("groups by tab, earliest pickup first", () => {
		expect(orders_in(all, "pending").map((item) => item.id)).toEqual(["041", "043"]);
		expect(count_in(all, "history")).toBe(2);
		expect(tab_of("cancelled")).toBe("history");
	});

	test("progress steps", () => {
		expect(reached_step("pending")).toBe(0);
		expect(reached_step("delivered")).toBe(3);
		expect(reached_step("cancelled")).toBe(-1);
	});

	test("change for a $77 order paid with $100 is $23, never negative", () => {
		expect(change_due(77, 100)).toBe(23);
		expect(change_due(77, 50)).toBe(0);
	});
});

const product = (overrides: Partial<Product>): Product => ({
	id: "jitomate",
	name: "Jitomate saladet",
	category: "Verduras",
	unit: "kg",
	price: 32,
	stock: 14,
	low_stock_at: 5,
	reserved: 0,
	visible: true,
	image_url: null,
	...overrides,
});

describe("products", () => {
	test("status follows visibility, then stock", () => {
		expect(product_status(product({}))).toBe("available");
		expect(product_status(product({ stock: 3 }))).toBe("low");
		expect(product_status(product({ stock: 0 }))).toBe("out");
		expect(product_status(product({ stock: 0, visible: false }))).toBe("hidden");
	});

	test("search ignores accents and case; filters by status", () => {
		const list = [product({}), product({ id: "cilantro", name: "Cilantro fresco", category: "Hierbas", stock: 3 })];
		expect(filter_products(list, "CILÁNTRO", "all").map((item) => item.id)).toEqual(["cilantro"]);
		expect(filter_products(list, "", "low").map((item) => item.id)).toEqual(["cilantro"]);
	});

	test("the editor draft shows prices with cents", () => {
		expect(product_draft(product({ stock: 0.5 }))).toMatchObject({ price: "32.00", stock: "0.5" });
	});
});

describe("formatting", () => {
	test("money as the design shows it", () => {
		expect(mxn(1860)).toBe("$1,860");
		expect(mxn(32, { decimals: true })).toBe("$32.00");
		expect(signed_mxn(-260)).toBe("−$260.00");
		expect(signed_mxn(98)).toBe("+$98.00");
		expect(round_cents(0.1 + 0.2)).toBe(0.3);
	});

	test("the operating day is Mexico City's, not UTC's", () => {
		expect(iso_day(new Date("2026-10-26T03:00:00Z"))).toBe("2026-10-25");
	});

	test("quantities use the unit's singular and plural", () => {
		expect(quantity(1, "manojo")).toBe("1 manojo");
		expect(quantity(3, "manojo")).toBe("3 manojos");
		expect(quantity(0.5, "kg")).toBe("0.5 kg");
	});
});
