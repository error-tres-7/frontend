import { z } from "zod";
import { CATEGORIES, PAYMENT_METHODS, STALL_KINDS } from "#lib/merchant/labels.js";
import { HOUR, hour, text } from "#utils/schemas.js";

const PHONE = /^(?:\+?52[\s-]?)?(?:\d[\s-]?){10}$/;

class StallSchemas {
	Profile = z.object({
		id: z.string().min(1),
		/** Short name in the merchant's own navigation, e.g. "Doña Lucha". */
		name: z.string().min(1),
		owner_name: z.string().min(1),
		account_name: z.string().min(1),
		photo_url: z.string().nullable().default(null),
		open: z.boolean(),
		public_name: z.string(),
		kind: z.enum(STALL_KINDS),
		category: z.string(),
		market_id: z.string().nullable(),
		market_name: z.string().nullable(),
		stall: z.string(),
		aisle: z.string(),
		description: z.string(),
		days: z.array(z.number().int().min(0).max(6)),
		opens_at: hour,
		closes_at: hour,
		/** Declared acceptance only; an empty list means "Consulta al comerciante", never "all". */
		payments: z.array(z.enum(PAYMENT_METHODS)),
		show_phone: z.boolean(),
		phone: z.string().nullable(),
	});

	StallForm = z
		.object({
			public_name: text(2, 60, "Nombre que verán tus clientes"),
			kind: z.string().refine((value) => (STALL_KINDS as readonly string[]).includes(value), {
				message: "Elige dónde vendes.",
			}),
			category: z.string().refine((value) => (CATEGORIES as readonly string[]).includes(value), {
				message: "Elige tu giro de venta.",
			}),
			market_id: z.string(),
			stall: z.string().trim().max(10, "Número de local: máximo 10 caracteres."),
			aisle: z.string().trim().max(40, "Pasillo o referencia: máximo 40 caracteres."),
			description: z.string().trim().max(140, "Descripción: máximo 140 caracteres."),
			days: z.array(z.number().int().min(0).max(6)).min(1, "Elige al menos un día de atención."),
			opens_at: z.string().regex(HOUR, "Escribe la hora como 08:00."),
			closes_at: z.string().regex(HOUR, "Escribe la hora como 18:00."),
			payments: z
				.array(z.enum(PAYMENT_METHODS))
				.min(1, "Elige al menos una forma de pago antes de publicar tu puesto."),
			show_phone: z.boolean(),
			phone: z.string().trim(),
		})
		.superRefine((value, context) => {
			if (value.kind === "market" && !value.market_id) {
				context.addIssue({ code: "custom", path: ["market_id"], message: "Elige el mercado al que perteneces." });
			}
			if (value.kind === "market" && !value.stall) {
				context.addIssue({ code: "custom", path: ["stall"], message: "Escribe tu número de local." });
			}
			if (HOUR.test(value.opens_at) && HOUR.test(value.closes_at) && value.closes_at <= value.opens_at) {
				context.addIssue({
					code: "custom",
					path: ["closes_at"],
					message: "La hora de cierre debe ser después de abrir.",
				});
			}
			if (value.show_phone && !PHONE.test(value.phone)) {
				context.addIssue({
					code: "custom",
					path: ["phone"],
					message: "Escribe un teléfono de 10 dígitos; puedes incluir +52.",
				});
			}
		})
		.transform((value) => ({
			...value,
			kind: value.kind as (typeof STALL_KINDS)[number],
			market_id: value.kind === "market" ? value.market_id : null,
			days: [...new Set(value.days)].sort((a, b) => a - b),
			payments: PAYMENT_METHODS.filter((method) => value.payments.includes(method)),
			// The access phone is never published implicitly.
			phone: value.show_phone ? value.phone : null,
		}));
}

export const StallSchema = new StallSchemas();
