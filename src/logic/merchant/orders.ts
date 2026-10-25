import type { Order } from "#typing/schemas/merchants.js";
import type { OrderStatus } from "./labels.js";

export const ORDER_TABS = [
	{ id: "pending", label: "Por confirmar", statuses: ["pending"] },
	{ id: "preparing", label: "En preparación", statuses: ["preparing"] },
	{ id: "ready", label: "Listos", statuses: ["ready"] },
	{ id: "history", label: "Historial", statuses: ["delivered", "cancelled"] },
] as const satisfies readonly { id: string; label: string; statuses: readonly OrderStatus[] }[];

export type OrderTab = (typeof ORDER_TABS)[number]["id"];

export function tab_of(status: OrderStatus): OrderTab {
	return ORDER_TABS.find((tab) => (tab.statuses as readonly OrderStatus[]).includes(status))?.id ?? "history";
}

export function orders_in(orders: Order[], tab: OrderTab) {
	return orders
		.filter((order) => tab_of(order.status) === tab)
		.sort((a, b) => a.pickup.from.localeCompare(b.pickup.from) || a.number.localeCompare(b.number));
}

export function count_in(orders: Order[], tab: OrderTab) {
	return orders.filter((order) => tab_of(order.status) === tab).length;
}

/** Steps shown in the order progress bar; cancelled orders show none reached after cancellation. */
export const ORDER_STEPS = ["Confirmar", "Preparar", "Listo", "Entregar"] as const;

export function reached_step(status: OrderStatus) {
	return { pending: 0, preparing: 1, ready: 2, delivered: 3, cancelled: -1 }[status];
}

/** Change to give back in cash, never negative. */
export function change_due(total: number, received: number) {
	return Math.max(0, Math.round((received - total) * 100) / 100);
}
