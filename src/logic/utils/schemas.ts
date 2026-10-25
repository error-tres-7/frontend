import { z } from "zod";

export const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const HOUR = /^([01]\d|2[0-3]):[0-5]\d$/;
const AMOUNT = /^\$?\s*(\d{1,3}(,\d{3})+|\d+)([.]\d{1,2})?$/;

/** Peso amounts typed by a person: `$1,250.50`, `30`, `30.5`; at most two decimals. */
export const amount_text = (empty: string, zero: string) =>
	z
		.string()
		.trim()
		.min(1, { message: empty, abort: true })
		.regex(AMOUNT, "Usa solo números, con máximo dos decimales.")
		.transform((value) => Number(value.replace(/[$,\s]/g, "")))
		.refine((value) => value > 0, zero)
		.refine((value) => value <= 999_999, "El monto es demasiado alto.");

/** A quantity typed by a person; whole numbers unless `decimals`. */
export const quantity_text = (empty: string, decimals: boolean) =>
	z
		.string()
		.trim()
		.min(1, { message: empty, abort: true })
		.regex(
			decimals ? /^\d+([.]\d{1,2})?$/ : /^\d+$/,
			decimals ? "Usa un número con máximo dos decimales." : "Usa un número entero."
		)
		.transform(Number)
		.refine((value) => value <= 99_999, "La cantidad es demasiado alta.");

export const text = (min: number, max: number, label: string) =>
	z
		.string()
		.trim()
		.min(min, min > 1 ? `${label}: escribe al menos ${min} caracteres.` : `${label}: este dato es obligatorio.`)
		.max(max, `${label}: máximo ${max} caracteres.`);

/** Money as the API sends it: finite, non-negative, cents. */
export const money = z.number().finite().nonnegative();

/** A money amount with sign, for movements. */
export const signed_money = z.number().finite();

export const day = z.string().regex(DAY);
export const hour = z.string().regex(HOUR);
export const instant = z.iso.datetime({ offset: true });
