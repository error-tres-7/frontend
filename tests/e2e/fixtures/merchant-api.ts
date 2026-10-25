import type { Page, Request, Route } from "@playwright/test";

/**
 * Test-only stand-in for the merchant API contract (MERCHANT-API.md), seeded with the design's
 * illustrative data. It intercepts the browser's requests; the app ships no mock.
 */

const day = (offset = 0, from = new Date()) =>
	new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(
		new Date(from.getTime() + offset * 86_400_000)
	);

const items = {
	jitomate: { product_id: "jitomate", name: "Jitomate saladet", quantity: 1, unit: "kg", amount: 32 },
	aguacate: { product_id: "aguacate", name: "Aguacate Hass", quantity: 0.5, unit: "kg", amount: 35 },
	cilantro: { product_id: "cilantro", name: "Cilantro fresco", quantity: 1, unit: "manojo", amount: 10 },
};

type Order = {
	id: string;
	number: string;
	customer_name: string;
	pickup: { from: string; to: string };
	total: number;
	note: string | null;
	status: string;
	items: (typeof items)[keyof typeof items][];
	payment: { method: string; amount: number; received: number | null } | null;
	created_at: string;
};

const order = (
	number: string,
	customer_name: string,
	from: string,
	to: string,
	total: number,
	status: string,
	extra: Partial<Order> = {}
): Order => ({
	id: `o${number}`,
	number,
	customer_name,
	pickup: { from, to },
	total,
	note: null,
	status,
	items: [items.jitomate, items.aguacate, items.cilantro],
	payment: null,
	created_at: `${day()}T09:00:00-06:00`,
	...extra,
});

function seed() {
	const today = day();
	return {
		today,
		profile: {
			id: "dona-lucha",
			name: "Doña Lucha",
			owner_name: "Lucha",
			account_name: "Lucha García",
			photo_url: null,
			open: true,
			public_name: "Frutas y verduras Doña Lucha",
			kind: "market",
			category: "Frutas y verduras",
			market_id: "medellin",
			market_name: "Mercado Medellín",
			stall: "24",
			aisle: "Pasillo B",
			description: "Fresco, de temporada y elegido con cariño.",
			days: [1, 2, 3, 4, 5, 6, 0],
			opens_at: "08:00",
			closes_at: "18:00",
			payments: ["cash", "transfer", "card"],
			show_phone: false,
			phone: null,
		} as Record<string, unknown>,
		orders: [
			order("041", "Ana López", "12:30", "13:00", 77, "pending", { note: "Prefiero los aguacates listos para hoy." }),
			order("042", "Diego Ruiz", "13:00", "13:30", 124, "pending"),
			order("043", "Sofía Pérez", "13:30", "14:00", 56, "pending"),
			order("040", "Luis Martínez", "12:00", "12:30", 135, "ready"),
			order("039", "Carmen Díaz", "11:30", "12:00", 98, "delivered", {
				payment: { method: "cash", amount: 98, received: 100 },
			}),
		],
		products: [
			{
				id: "jitomate",
				name: "Jitomate saladet",
				category: "Verduras",
				unit: "kg",
				price: 32,
				stock: 14,
				low_stock_at: 5,
				reserved: 1,
				visible: true,
				image_url: null,
			},
			{
				id: "aguacate",
				name: "Aguacate Hass",
				category: "Frutas",
				unit: "kg",
				price: 70,
				stock: 8,
				low_stock_at: 2,
				reserved: 0,
				visible: true,
				image_url: null,
			},
			{
				id: "cilantro",
				name: "Cilantro fresco",
				category: "Hierbas",
				unit: "manojo",
				price: 10,
				stock: 3,
				low_stock_at: 5,
				reserved: 0,
				visible: true,
				image_url: null,
			},
			{
				id: "guayaba",
				name: "Guayaba",
				category: "Frutas",
				unit: "kg",
				price: 45,
				stock: 0,
				low_stock_at: 2,
				reserved: 0,
				visible: true,
				image_url: null,
			},
		] as Record<string, unknown>[],
		movements: [
			{ id: "m4", kind: "sale", label: "Venta #039", amount: 98, method: "cash", at: `${today}T11:42:00-06:00` },
			{ id: "m3", kind: "sale", label: "Venta #038", amount: 135, method: "transfer", at: `${today}T11:10:00-06:00` },
			{
				id: "m2",
				kind: "expense",
				label: "Compra de mercancía",
				amount: 260,
				method: "cash",
				at: `${today}T10:30:00-06:00`,
			},
			{
				id: "m1",
				kind: "sale",
				label: "Venta en el puesto",
				amount: 85,
				method: "cash",
				at: `${today}T10:15:00-06:00`,
			},
		],
		totals: { sales: 1860, sales_count: 12, expenses: 780, balance: 1080 },
		collected: { cash: 1420, transfer: 440, card: 0 },
		references: [
			{
				id: "r1",
				market: "Jamaica",
				label: "Ejemplo A",
				price: 28,
				source: "Ficha simulada",
				as_of: today,
				comparable: true,
			},
			{
				id: "r2",
				market: "Portales",
				label: "Ejemplo B",
				price: 30,
				source: "Ficha simulada",
				as_of: today,
				comparable: true,
			},
			{
				id: "r3",
				market: "Coyoacán",
				label: "Ejemplo C",
				price: 34,
				source: "Ficha simulada",
				as_of: today,
				comparable: true,
			},
		],
	};
}

export type Sent = { method: string; path: string; body: unknown; key: string | null };

export class MerchantApi {
	state = seed();
	/** Every request the app made, in order. */
	sent: Sent[] = [];
	#failures: { method: string; path: RegExp; status: number }[] = [];
	#written = new Map<string, unknown>();

	/** The next matching request answers `status` instead of succeeding. */
	fail_next(method: string, path: RegExp, status = 500) {
		this.#failures.push({ method, path, status });
	}

	writes(method: string, path: RegExp) {
		return this.sent.filter((call) => call.method === method && path.test(call.path));
	}

	async attach(page: Page) {
		await page.route("**/api/merchant/**", (route, request) => this.#handle(route, request));
	}

	async #handle(route: Route, request: Request) {
		const url = new URL(request.url());
		const path = url.pathname.replace(/^\/api/, "");
		const method = request.method();
		const body = request.postDataJSON?.() ?? null;
		const key = request.headers()["idempotency-key"] ?? null;
		this.sent.push({ method, path, body, key });

		const failure = this.#failures.findIndex((item) => item.method === method && item.path.test(path));
		if (failure >= 0) {
			const [{ status }] = this.#failures.splice(failure, 1);
			return route.fulfill({ status, json: { message: "simulated-failure" } });
		}
		if (key && this.#written.has(key)) return route.fulfill({ json: this.#written.get(key) });

		const result = this.#answer(method, path, body);
		if (result === undefined) return route.fulfill({ status: 404, json: { message: "not-found" } });
		if (key) this.#written.set(key, result);
		if (typeof result === "string") return route.fulfill({ body: result, contentType: "text/csv" });
		return route.fulfill({ json: result });
	}

	#answer(method: string, path: string, body: Record<string, unknown> | null): unknown {
		const s = this.state;
		if (method === "GET" && path === "/merchant/profile") return s.profile;
		if (method === "PUT" && path === "/merchant/profile") return Object.assign(s.profile, body);
		if (method === "GET" && path === "/merchant/overview") {
			const week = Array.from({ length: 7 }, (_, index) => ({
				date: day(index - 6),
				total: [980, 1240, 1100, 1540, 1450, 1720, s.totals.sales][index],
			}));
			const jitomate = s.products.find((product) => product.id === "jitomate");
			return {
				date: s.today,
				totals: s.totals,
				collected: s.collected,
				week,
				pending_orders: s.orders.filter((item) => item.status === "pending").length,
				low_stock: [{ product_id: "cilantro", name: "Cilantro", stock: 3, unit: "manojo" }],
				orders: s.orders.filter((item) => ["041", "040", "039"].includes(item.number)),
				price_reference: {
					product_id: "jitomate",
					product_name: "Jitomate saladet",
					category: "Frutas y verduras",
					price: jitomate?.price,
					unit: "kg",
					min: 28,
					max: 34,
					markets: ["Jamaica", "Portales", "Coyoacán"],
					illustrative: true,
					as_of: s.today,
				},
			};
		}
		if (method === "GET" && path === "/merchant/orders") return s.orders;
		const step = path.match(/^\/merchant\/orders\/([^/]+)\/(accept|ready|deliver|cancel)$/);
		if (method === "POST" && step) {
			const target = s.orders.find((item) => item.id === step[1]);
			if (!target) return undefined;
			target.status = { accept: "preparing", ready: "ready", deliver: "delivered", cancel: "cancelled" }[step[2]] ?? "";
			if (step[2] === "deliver") {
				target.payment = {
					method: String(body?.method),
					amount: target.total,
					received: (body?.received as number | null) ?? null,
				};
			}
			return target;
		}
		if (method === "GET" && path === "/merchant/products") return s.products;
		if (method === "POST" && path === "/merchant/products") {
			const created = { ...body, id: `p${s.products.length + 1}`, reserved: 0, image_url: null };
			s.products.push(created);
			return created;
		}
		const product = path.match(/^\/merchant\/products\/([^/]+)(\/references)?$/);
		if (product) {
			const target = s.products.find((item) => item.id === product[1]);
			if (!target) return undefined;
			if (method === "PATCH" && !product[2]) return Object.assign(target, body);
			if (method === "GET" && product[2]) {
				return {
					product: {
						id: target.id,
						name: target.name,
						category: "Frutas y verduras",
						variety: "Convencional",
						grade: "Primera",
						presentation: "Fresco",
						channel: "Menudeo",
						unit: target.unit,
						price: target.price,
					},
					references: s.references,
					illustrative: true,
				};
			}
		}
		if (method === "GET" && path === "/merchant/finances") {
			return {
				date: s.today,
				totals: s.totals,
				collected: s.collected,
				cash: { opening: 200, expected: 200 + s.collected.cash - s.totals.expenses, cash_expenses: s.totals.expenses },
				movements: s.movements,
			};
		}
		if (method === "POST" && (path === "/merchant/expenses" || path === "/merchant/sales")) {
			const sale = path.endsWith("sales");
			const amount = Number(body?.amount);
			const movement = {
				id: `m${s.movements.length + 1}`,
				kind: sale ? "sale" : "expense",
				label: String(body?.concept ?? (sale ? "Venta en el puesto" : "Gasto")),
				amount,
				method: String(body?.method),
				at: `${s.today}T12:00:00-06:00`,
			};
			s.movements.unshift(movement);
			if (sale) {
				s.totals.sales += amount;
				s.totals.sales_count += 1;
			} else {
				s.totals.expenses += amount;
			}
			s.totals.balance = s.totals.sales - s.totals.expenses;
			return movement;
		}
		if (method === "GET" && path === "/merchant/finances/export") return "fecha,concepto,monto\n";
		return undefined;
	}
}

export async function merchant_api(page: Page) {
	const api = new MerchantApi();
	await api.attach(page);
	return api;
}
