import { describe, expect, test } from "bun:test";
import { FinancesSchema } from "#schemas/merchants/finances/index.js";
import { OrdersSchema } from "#schemas/merchants/orders/index.js";
import { ProductsSchema } from "#schemas/merchants/products/index.js";
import { StallSchema } from "#schemas/merchants/stall/index.js";
import type { StallInput } from "#typing/schemas/merchants.js";

const messages = (result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
	Object.fromEntries((result.error?.issues ?? []).map((issue) => [issue.path.join("."), issue.message]));

describe("price form", () => {
	test.each([
		["30", 30],
		["$30.00", 30],
		[" 32.5 ", 32.5],
		["$1,250.50", 1250.5],
	])("accepts %p as %p", (price, expected) => {
		expect(ProductsSchema.PriceForm.parse({ price }).price).toBe(expected);
	});

	test.each([
		["", "Escribe el nuevo precio."],
		["0", "Escribe un precio mayor a $0."],
		["0.00", "Escribe un precio mayor a $0."],
		["-5", "Usa solo números, con máximo dos decimales."],
		["30.555", "Usa solo números, con máximo dos decimales."],
		["treinta", "Usa solo números, con máximo dos decimales."],
	])("rejects %p", (price, message) => {
		expect(messages(ProductsSchema.PriceForm.safeParse({ price })).price).toBe(message);
	});
});

describe("product form", () => {
	const valid = {
		name: "Jitomate saladet",
		category: "Verduras",
		unit: "kg",
		price: "32",
		stock: "14",
		low_stock_at: "5",
		visible: true,
	};

	test("parses typed strings into the API body", () => {
		expect(ProductsSchema.ProductForm.parse({ ...valid, stock: "0.5" })).toEqual({
			name: "Jitomate saladet",
			category: "Verduras",
			unit: "kg",
			price: 32,
			stock: 0.5,
			low_stock_at: 5,
			visible: true,
		});
	});

	test("allows zero stock but never negative stock", () => {
		expect(ProductsSchema.ProductForm.safeParse({ ...valid, stock: "0" }).success).toBe(true);
		expect(messages(ProductsSchema.ProductForm.safeParse({ ...valid, stock: "-1" })).stock).toBeDefined();
	});

	test("counted units need whole numbers", () => {
		const result = ProductsSchema.ProductForm.safeParse({ ...valid, unit: "manojo", stock: "2.5" });
		expect(messages(result).stock).toBe("Por manojo usa números enteros.");
	});

	test("rejects unknown units", () => {
		expect(messages(ProductsSchema.ProductForm.safeParse({ ...valid, unit: "caja" })).unit).toBe(
			"Elige cómo se vende."
		);
	});
});

describe("expense form", () => {
	const today = "2026-10-25";
	const valid = {
		amount: "260",
		concept: "Compra de mercancía",
		category: "Compra de mercancía",
		method: "cash",
		date: today,
	} as const;

	test("parses a valid expense", () => {
		expect(FinancesSchema.Expense(today).parse(valid)).toEqual({ ...valid, amount: 260 });
	});

	test("rejects a zero amount with the design's message", () => {
		expect(messages(FinancesSchema.Expense(today).safeParse({ ...valid, amount: "0" })).amount).toBe(
			"Escribe un monto mayor a $0."
		);
	});

	test("rejects future dates, missing categories and unknown methods", () => {
		const result = messages(
			FinancesSchema.Expense(today).safeParse({ ...valid, date: "2026-10-26", category: "", method: "vales" })
		);
		expect(result.date).toBe("La fecha no puede ser futura.");
		expect(result.category).toBe("Elige una categoría.");
		expect(result.method).toBe("Elige con qué pagaste.");
	});
});

describe("sale form", () => {
	test("an empty concept is sent as null", () => {
		expect(FinancesSchema.Sale.parse({ amount: "85", concept: " ", method: "transfer" })).toEqual({
			amount: 85,
			concept: null,
			method: "transfer",
		});
	});

	test("requires how the customer paid", () => {
		expect(messages(FinancesSchema.Sale.safeParse({ amount: "85", concept: "", method: "" })).method).toBe(
			"Elige cómo te pagaron."
		);
	});
});

describe("delivery", () => {
	const deliver = OrdersSchema.Deliver(77);

	test("cash needs what was received, covering the total", () => {
		expect(messages(deliver.safeParse({ method: "cash", received: "" })).received).toBe("Escribe cuánto recibiste.");
		expect(messages(deliver.safeParse({ method: "cash", received: "50" })).received).toBe(
			"Lo recibido no cubre el total del pedido."
		);
		expect(deliver.parse({ method: "cash", received: "$100" })).toEqual({ method: "cash", received: 100 });
	});

	test("other methods ignore the received amount", () => {
		expect(deliver.parse({ method: "transfer", received: "abc" })).toEqual({ method: "transfer", received: null });
	});
});

describe("stall form", () => {
	const valid: StallInput = {
		public_name: "Frutas y verduras Doña Lucha",
		kind: "market",
		category: "Frutas y verduras",
		market_id: "medellin",
		stall: "24",
		aisle: "Pasillo B",
		description: "Fresco, de temporada y elegido con cariño.",
		days: [6, 1, 2, 1],
		opens_at: "08:00",
		closes_at: "18:00",
		payments: ["card", "cash"],
		show_phone: false,
		phone: "55 1234 5678",
	};

	test("never publishes the phone unless the merchant chose to", () => {
		expect(StallSchema.StallForm.parse(valid).phone).toBeNull();
		expect(StallSchema.StallForm.parse({ ...valid, show_phone: true }).phone).toBe("55 1234 5678");
	});

	test("normalizes days and payment order", () => {
		const parsed = StallSchema.StallForm.parse(valid);
		expect(parsed.days).toEqual([1, 2, 6]);
		expect(parsed.payments).toEqual(["cash", "card"]);
	});

	test("requires at least one declared payment method before publishing", () => {
		expect(messages(StallSchema.StallForm.safeParse({ ...valid, payments: [] })).payments).toBe(
			"Elige al menos una forma de pago antes de publicar tu puesto."
		);
	});

	test("a market stall needs its market and local; other kinds drop the market", () => {
		const result = messages(StallSchema.StallForm.safeParse({ ...valid, market_id: "", stall: "" }));
		expect(result.market_id).toBe("Elige el mercado al que perteneces.");
		expect(result.stall).toBe("Escribe tu número de local.");
		expect(StallSchema.StallForm.parse({ ...valid, kind: "tianguis", market_id: "" }).market_id).toBeNull();
	});

	test("closing must come after opening, and a shown phone must be valid", () => {
		const result = messages(
			StallSchema.StallForm.safeParse({ ...valid, closes_at: "07:00", show_phone: true, phone: "123" })
		);
		expect(result.closes_at).toBe("La hora de cierre debe ser después de abrir.");
		expect(result.phone).toBe("Escribe un teléfono de 10 dígitos; puedes incluir +52.");
	});
});
