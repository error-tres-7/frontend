import { defineEnvVars } from "@sveltejs/kit/env";
import { z } from "zod";

export const variables = defineEnvVars({
	API_URL: {
		static: true,
		public: true,
		description: "Base URL of the commerce API. Unset or empty, services call the same-origin `/api` path.",
		schema: (value) => (value?.trim() ? z.url().parse(value.trim()).replace(/\/+$/, "") : undefined),
	},
});
