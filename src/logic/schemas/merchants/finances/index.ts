import { z } from "zod";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "#lib/merchant/labels.js";
import { amount_text, DAY, day, instant, money, text } from "#utils/schemas.js";

const method = (message: string) =>
	z.string().refine((value) => (PAYMENT_METHODS as readonly string[]).includes(value), { message });

class FinancesSchemas {
	Totals = z.object({
		sales: money,
		sales_count: z.number().int().nonnegative(),
		expenses: money,
		/** Collected minus spent for the period; never profit. */
		balance: z.number().finite(),
	});

	/** What sales were actually paid with, not what the stall accepts. */
	Collected = z.object({ cash: money, transfer: money, card: money });

	Movement = z.object({
		id: z.string().min(1),
		kind: z.enum(["sale", "expense"]),
		label: z.string().min(1),
		amount: money,
		method: z.enum(PAYMENT_METHODS),
		at: instant,
	});

	Finances = z.object({
		date: day,
		totals: this.Totals,
		collected: this.Collected,
		cash: z.object({ opening: money, expected: z.number().finite(), cash_expenses: money }),
		movements: z.array(this.Movement),
	});

	Expense = (today: string) =>
		z
			.object({
				amount: amount_text("Escribe un monto.", "Escribe un monto mayor a $0."),
				concept: text(2, 80, "Concepto"),
				category: z.string().refine((value) => (EXPENSE_CATEGORIES as readonly string[]).includes(value), {
					message: "Elige una categoría.",
				}),
				method: method("Elige con qué pagaste."),
				date: z
					.string()
					.regex(DAY, "Elige una fecha.")
					.refine((value) => value <= today, "La fecha no puede ser futura."),
			})
			.transform((value) => ({ ...value, method: value.method as (typeof PAYMENT_METHODS)[number] }));

	Sale = z
		.object({
			amount: amount_text("Escribe cuánto cobraste.", "Escribe un monto mayor a $0."),
			concept: z.string().trim().max(80, "Concepto: máximo 80 caracteres."),
			method: method("Elige cómo te pagaron."),
		})
		.transform((value) => ({
			amount: value.amount,
			concept: value.concept || null,
			method: value.method as (typeof PAYMENT_METHODS)[number],
		}));
}

export const FinancesSchema = new FinancesSchemas();
