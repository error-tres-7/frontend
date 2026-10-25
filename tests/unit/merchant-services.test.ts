import { afterEach, beforeAll, describe, expect, mock, test } from "bun:test";

mock.module("$app/env/public", () => ({ API_URL: "https://api.test" }));

type Call = { url: string; method: string; headers: Headers; body: unknown };
const calls: Call[] = [];
const original = globalThis.fetch;

/** Answers every request with `body` and records what was sent. */
function answer(body: unknown, status = 200, type = "application/json") {
	globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
		calls.push({
			url: String(input),
			method: init?.method ?? "GET",
			headers: new Headers(init?.headers),
			body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
		});
		return new Response(typeof body === "string" ? body : JSON.stringify(body), {
			status,
			headers: { "Content-Type": type },
		});
	}) as typeof fetch;
}

afterEach(() => {
	calls.length = 0;
	globalThis.fetch = original;
});

let services: typeof import("#services/merchants/index.js");
let global: typeof import("#services/global/index.js");
beforeAll(async () => {
	services = await import("#services/merchants/index.js");
	global = await import("#services/global/index.js");
});

const product = {
	id: "jitomate",
	name: "Jitomate saladet",
	category: "Verduras",
	unit: "kg",
	price: 30,
	stock: 14,
	low_stock_at: 5,
	visible: true,
} as const;

describe("merchant services", () => {
	test("reads the day's orders with the date as a query parameter", async () => {
		answer([]);
		expect(await services.orders.list({ params: { date: "2026-10-25" } })).toEqual([]);
		expect(calls[0]).toMatchObject({ url: "https://api.test/merchant/orders?date=2026-10-25", method: "GET" });
	});

	test("a price change is a partial PATCH and returns the validated product", async () => {
		answer(product);
		const saved = await services.products.update({ body: { id: "jitomate", price: 30 } });
		expect(saved).toEqual({ ...product, reserved: 0, image_url: null });
		expect(calls[0]).toMatchObject({
			url: "https://api.test/merchant/products/jitomate",
			method: "PATCH",
			body: { price: 30 },
		});
	});

	test("writes that must happen once carry the caller's idempotency key", async () => {
		answer({
			id: "m1",
			kind: "expense",
			label: "Compra",
			amount: 260,
			method: "cash",
			at: "2026-10-25T10:30:00-06:00",
		});
		await services.finances.expense({
			body: { amount: 260, concept: "Compra", category: "Compra de mercancía", method: "cash", date: "2026-10-25" },
			key: "retry-safe-key",
		});
		expect(calls[0].method).toBe("POST");
		expect(calls[0].url).toBe("https://api.test/merchant/expenses");
		expect(calls[0].headers.get("Idempotency-Key")).toBe("retry-safe-key");
	});

	test("order steps post to their action", async () => {
		answer({
			id: "o41",
			number: "041",
			customer_name: "Ana López",
			pickup: { from: "12:30", to: "13:00" },
			total: 77,
			status: "preparing",
			items: [],
			created_at: "2026-10-25T10:00:00-06:00",
		});
		const accepted = await services.orders.accept({ body: { id: "o41" } });
		expect(accepted.status).toBe("preparing");
		expect(calls[0]).toMatchObject({ url: "https://api.test/merchant/orders/o41/accept", method: "POST" });
	});

	test("a response that breaks the contract is an error, not data", async () => {
		answer({ ...product, price: "30" });
		const failure = await services.products.update({ body: { id: "jitomate", price: 30 } }).catch((error) => error);
		expect(global.failure_status(failure)).toBe(502);
		expect(failure.message).toBe("invalid-response");
	});

	test("a refused request keeps the API's status and message", async () => {
		answer({ message: "price-conflict" }, 409);
		const failure = await services.products.update({ body: { id: "jitomate", price: 30 } }).catch((error) => error);
		expect(global.failure_status(failure)).toBe(409);
		expect(failure.message).toBe("price-conflict");
	});

	test("the CSV export is returned as text", async () => {
		answer("fecha,concepto\n2026-10-25,Venta", 200, "text/csv");
		expect(await services.finances.export({ params: { date: "2026-10-25" } })).toContain("Venta");
		expect(calls[0].url).toBe("https://api.test/merchant/finances/export?date=2026-10-25");
	});
});
