import { OverviewSchema } from "#schemas/merchants/overview/index.js";
import { StallSchema } from "#schemas/merchants/stall/index.js";
import type { DayConfig, ReadConfig, StallSaveConfig } from "#typing/services/merchants.js";
import { GlobalService } from "../global/index.js";

class Stall extends GlobalService {
	profile = async ({ signal }: ReadConfig = {}) => {
		const { payload } = await this.api.get<unknown>("/merchant/profile", this.call(signal));

		return this.parsed(StallSchema.Profile, payload);
	};

	save = async ({ body, signal }: StallSaveConfig) => {
		const { payload } = await this.api.put<typeof body, unknown>("/merchant/profile", body, this.call(signal));

		return this.parsed(StallSchema.Profile, payload);
	};

	overview = async ({ params, signal }: DayConfig) => {
		const { payload } = await this.api.get<unknown, typeof params>("/merchant/overview", {
			...this.call(signal),
			params,
		});

		return this.parsed(OverviewSchema.Overview, payload);
	};
}

export const stall = new Stall();
