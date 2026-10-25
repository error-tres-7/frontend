export const PAYMENT_METHODS = ["cash", "transfer", "card"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_LABELS: Record<PaymentMethod, { label: string; hint: string }> = {
	cash: { label: "Efectivo", hint: "Al recoger" },
	transfer: { label: "Transferencia", hint: "Directo a tu cuenta" },
	card: { label: "Tarjeta", hint: "Terminal en el puesto" },
};

export const UNITS = ["kg", "pieza", "manojo"] as const;
export type Unit = (typeof UNITS)[number];

export const UNIT_LABELS: Record<Unit, { name: string; one: string; many: string; decimals: boolean }> = {
	kg: { name: "Kilogramo", one: "kg", many: "kg", decimals: true },
	pieza: { name: "Pieza", one: "pieza", many: "piezas", decimals: false },
	manojo: { name: "Manojo", one: "manojo", many: "manojos", decimals: false },
};

/** `14 kg`, `1 manojo`, `3 manojos`, `0.5 kg`. */
export function quantity(amount: number, unit: Unit) {
	const labels = UNIT_LABELS[unit];
	const value = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(amount);
	return `${value} ${amount === 1 ? labels.one : labels.many}`;
}

export const ORDER_STATUSES = ["pending", "preparing", "ready", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_LABELS: Record<OrderStatus, { label: string; tone: "warn" | "ok" | "muted" | "alert" }> = {
	pending: { label: "Por confirmar", tone: "warn" },
	preparing: { label: "En preparación", tone: "ok" },
	ready: { label: "Listo para recoger", tone: "ok" },
	delivered: { label: "Entregado", tone: "ok" },
	cancelled: { label: "Cancelado", tone: "alert" },
};

export const STALL_KINDS = ["market", "tianguis", "business"] as const;
export type StallKind = (typeof STALL_KINDS)[number];

export const STALL_KIND_LABELS: Record<StallKind, string> = {
	market: "Mercado",
	tianguis: "Tianguis",
	business: "Negocio",
};

export const CATEGORIES = [
	"Frutas y verduras",
	"Carnes",
	"Pollería",
	"Pescados y mariscos",
	"Abarrotes",
	"Cremería",
	"Panadería",
	"Comida preparada",
	"Flores y plantas",
	"Otro giro",
] as const;

export const EXPENSE_CATEGORIES = [
	"Compra de mercancía",
	"Transporte",
	"Insumos y empaques",
	"Renta o cuota del local",
	"Servicios",
	"Otro gasto",
] as const;

/** Monday first, as the opening-days picker shows them. */
export const WEEK_DAYS = [
	{ value: 1, short: "L", name: "Lunes" },
	{ value: 2, short: "M", name: "Martes" },
	{ value: 3, short: "M", name: "Miércoles" },
	{ value: 4, short: "J", name: "Jueves" },
	{ value: 5, short: "V", name: "Viernes" },
	{ value: 6, short: "S", name: "Sábado" },
	{ value: 0, short: "D", name: "Domingo" },
] as const;
