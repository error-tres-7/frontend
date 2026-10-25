import { z } from "zod";
import { UNIT_LABELS, UNITS } from "#lib/merchant/labels.js";
import { amount_text, day, money, quantity_text, text } from "#utils/schemas.js";

class ProductsSchemas {
	Product = z.object({
		id: z.string().min(1),
		name: z.string().min(1),
		category: z.string(),
		unit: z.enum(UNITS),
		price: money,
		stock: z.number().finite().nonnegative(),
		low_stock_at: z.number().finite().nonnegative(),
		/** Stock held by accepted apartados, already subtracted from `stock`. */
		reserved: z.number().finite().nonnegative().default(0),
		visible: z.boolean(),
		image_url: z.string().nullable().default(null),
	});

	Products = z.array(this.Product);

	/** Every field is a string or boolean as typed; parsing yields the API body. */
	ProductForm = z
		.object({
			name: text(2, 60, "Nombre del producto"),
			category: text(1, 40, "Categoría"),
			unit: z.string().refine((value) => (UNITS as readonly string[]).includes(value), {
				message: "Elige cómo se vende.",
			}),
			price: amount_text("Escribe un precio.", "Escribe un precio mayor a $0."),
			stock: quantity_text("Escribe cuánto tienes; puede ser 0.", true),
			low_stock_at: quantity_text("Escribe cuándo avisarte; puede ser 0.", true),
			visible: z.boolean(),
		})
		.superRefine((value, context) => {
			const unit = UNIT_LABELS[value.unit as (typeof UNITS)[number]];
			if (!unit || unit.decimals) return;
			for (const key of ["stock", "low_stock_at"] as const) {
				if (!Number.isInteger(value[key])) {
					context.addIssue({ code: "custom", path: [key], message: `Por ${unit.one} usa números enteros.` });
				}
			}
		})
		.transform((value) => ({ ...value, unit: value.unit as (typeof UNITS)[number] }));

	PriceForm = z.object({
		price: amount_text("Escribe el nuevo precio.", "Escribe un precio mayor a $0."),
	});

	Reference = z.object({
		id: z.string().min(1),
		market: z.string().min(1),
		label: z.string().min(1),
		price: money,
		source: z.string().min(1),
		as_of: day,
		/** Same giro, product, variety, grade, channel and unit as the merchant's product. */
		comparable: z.boolean(),
	});

	References = z.object({
		product: z.object({
			id: z.string().min(1),
			name: z.string().min(1),
			category: z.string(),
			variety: z.string(),
			grade: z.string(),
			presentation: z.string(),
			channel: z.string(),
			unit: z.enum(UNITS),
			price: money,
		}),
		references: z.array(this.Reference),
		/** True while the references are simulated examples rather than verified prices. */
		illustrative: z.boolean(),
	});
}

export const ProductsSchema = new ProductsSchemas();
