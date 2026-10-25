import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_METHODS, UNITS } from "#lib/merchant/labels.js";
import { amount_text, hour, instant, money } from "#utils/schemas.js";

export const CANCEL_REASONS = [
	"Se agotó un producto",
	"No alcanzo a prepararlo a tiempo",
	"El puesto cerrará antes",
	"Otro motivo",
] as const;

class OrdersSchemas {
	Item = z.object({
		product_id: z.string().min(1),
		name: z.string().min(1),
		quantity: z.number().positive(),
		unit: z.enum(UNITS),
		amount: money,
	});

	Order = z.object({
		id: z.string().min(1),
		number: z.string().min(1),
		customer_name: z.string().min(1),
		pickup: z.object({ from: hour, to: hour }),
		total: money,
		note: z.string().nullable().default(null),
		status: z.enum(ORDER_STATUSES),
		items: z.array(this.Item),
		payment: z
			.object({ method: z.enum(PAYMENT_METHODS), amount: money, received: money.nullable().default(null) })
			.nullable()
			.default(null),
		created_at: instant,
	});

	Orders = z.array(this.Order);

	/** Delivery records the method actually used; cash needs what was received to give change. */
	Deliver = (total: number) =>
		z
			.object({
				method: z.string().refine((value) => (PAYMENT_METHODS as readonly string[]).includes(value), {
					message: "Elige cómo te pagaron.",
				}),
				received: z.string().trim(),
			})
			.superRefine((value, context) => {
				if (value.method !== "cash") return;
				const received = amount_text("Escribe cuánto recibiste.", "Escribe un monto mayor a $0.").safeParse(
					value.received
				);
				if (!received.success) {
					for (const issue of received.error.issues) context.addIssue({ ...issue, code: "custom", path: ["received"] });
					return;
				}
				if (received.data < total) {
					context.addIssue({
						code: "custom",
						path: ["received"],
						message: "Lo recibido no cubre el total del pedido.",
					});
				}
			})
			.transform((value) => ({
				method: value.method as (typeof PAYMENT_METHODS)[number],
				received: value.method === "cash" ? Number(value.received.replace(/[$,\s]/g, "")) : null,
			}));

	Cancel = z.object({
		reason: z.string().refine((value) => (CANCEL_REASONS as readonly string[]).includes(value), {
			message: "Elige un motivo para avisar a tu cliente.",
		}),
	});
}

export const OrdersSchema = new OrdersSchemas();
