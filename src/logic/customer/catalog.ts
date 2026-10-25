export type Product = {
	id: string;
	name: string;
	price: number;
	unit: "kg" | "manojo";
	step: number;
	image: "tomato" | "avocado" | "cilantro";
};

export type Merchant = {
	id: string;
	name: string;
	location: string;
	image: "lucha" | "avocado";
	payments: string[];
	products: Product[];
};

// These merchants, prices, payment declarations and products are illustrative only.
export const demo_merchants: Merchant[] = [
	{
		id: "dona-lucha",
		name: "Doña Lucha",
		location: "Local 24 · Pasillo B",
		image: "lucha",
		payments: ["Efectivo", "Transferencia", "Tarjeta"],
		products: [
			{ id: "jitomate", name: "Jitomate saladet", price: 32, unit: "kg", step: 0.5, image: "tomato" },
			{ id: "aguacate", name: "Aguacate Hass", price: 70, unit: "kg", step: 0.5, image: "avocado" },
			{ id: "cilantro", name: "Cilantro fresco", price: 10, unit: "manojo", step: 1, image: "cilantro" },
		],
	},
	{
		id: "huerto-pepe",
		name: "El huerto de Pepe",
		location: "Local 18 · Pasillo A",
		image: "avocado",
		payments: ["Efectivo", "Transferencia"],
		products: [{ id: "jitomate-pepe", name: "Jitomate saladet", price: 28, unit: "kg", step: 0.5, image: "tomato" }],
	},
];

export function merchant_by_id(id: string | null) {
	return demo_merchants.find((merchant) => merchant.id === id);
}

export function normalize_search(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLocaleLowerCase("es-MX")
		.trim();
}

function matches_search(text: string, query: string) {
	const normalized = normalize_search(text);
	const terms = normalize_search(query).split(/\s+/).filter(Boolean);
	return terms.every((term) => normalized.includes(term));
}

export function search_merchants(query: string) {
	return demo_merchants.filter((merchant) =>
		matches_search(`${merchant.name} ${merchant.products.map((product) => product.name).join(" ")}`, query)
	);
}

export function featured_product(merchant: Merchant, query: string) {
	return merchant.products.find((product) => matches_search(`${merchant.name} ${product.name}`, query));
}

export function money(amount: number) {
	return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);
}

export const pickup_options = ["Hoy · 12:30–13:00", "Hoy · 13:00–13:30", "Hoy · 13:30–14:00"];

export function validate_name(value: string) {
	return value.trim().length >= 2 && value.trim().length <= 80 ? undefined : "Escribe un nombre de 2 a 80 caracteres.";
}

export function validate_contact(value: string) {
	return /^(?:\+?52[\s-]?)?(?:\d[\s-]?){10}$/.test(value.trim())
		? undefined
		: "Escribe un celular de 10 dígitos; puedes incluir +52.";
}
