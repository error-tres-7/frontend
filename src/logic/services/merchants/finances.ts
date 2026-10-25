import { z } from "zod";
import { FinancesSchema } from "#schemas/merchants/finances/index.js";
import type { DayConfig, ExpenseConfig, SaleConfig } from "#typing/services/merchants.js";
import { GlobalService } from "../global/index.js";

class Finances extends GlobalService {
	day = async ({ params, signal }: DayConfig) => {
		const { payload } = await this.api.get<unknown, typeof params>("/merchant/finances", {
			...this.call(signal),
			params,
		});

		return this.parsed(FinancesSchema.Finances, payload);
	};

	expense = async ({ body, key, signal }: ExpenseConfig) => {
		const { payload } = await this.api.post<typeof body, unknown>("/merchant/expenses", body, this.call(signal, key));

		return this.parsed(FinancesSchema.Movement, payload);
	};

	/** A sale outside an apartado, collected at the stall. */
	sale = async ({ body, key, signal }: SaleConfig) => {
		const { payload } = await this.api.post<typeof body, unknown>("/merchant/sales", body, this.call(signal, key));

		return this.parsed(FinancesSchema.Movement, payload);
	};

	/** The day's movements as CSV text. */
	export = async ({ params, signal }: DayConfig) => {
		const { payload } = await this.api.get<unknown, typeof params>("/merchant/finances/export", {
			...this.call(signal),
			headers: new Headers({ Accept: "text/csv" }),
			params,
		});

		return this.parsed(z.string(), payload);
	};
}

export const finances = new Finances();
