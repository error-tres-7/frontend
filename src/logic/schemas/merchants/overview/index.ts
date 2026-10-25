import { z } from "zod";
import { UNITS } from "#lib/merchant/labels.js";
import { FinancesSchema } from "#schemas/merchants/finances/index.js";
import { OrdersSchema } from "#schemas/merchants/orders/index.js";
import { day, money } from "#utils/schemas.js";

class OverviewSchemas {
	Overview = z.object({
		date: day,
		totals: FinancesSchema.Totals,
		collected: FinancesSchema.Collected,
		/** Collected sales per day, oldest first, ending on `date`. */
		week: z.array(z.object({ date: day, total: money })).max(7),
		pending_orders: z.number().int().nonnegative(),
		low_stock: z.array(
			z.object({
				product_id: z.string().min(1),
				name: z.string().min(1),
				stock: z.number().nonnegative(),
				unit: z.enum(UNITS),
			})
		),
		/** Today's orders, newest first. */
		orders: OrdersSchema.Orders,
		/** A product with comparable references, or null when none qualify. */
		price_reference: z
			.object({
				product_id: z.string().min(1),
				product_name: z.string().min(1),
				category: z.string(),
				price: money,
				unit: z.enum(UNITS),
				min: money,
				max: money,
				markets: z.array(z.string()),
				illustrative: z.boolean(),
				as_of: day,
			})
			.nullable(),
	});
}

export const OverviewSchema = new OverviewSchemas();
