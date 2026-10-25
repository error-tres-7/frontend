import { AuthSchema } from "#schemas/auth/index.js";
import type { SignInConfig, SignUpConfig } from "#typing/services/auth.js";
import type { ReadConfig } from "#typing/services/merchants.js";
import { GlobalService } from "../global/index.js";

/** Session lives in an HttpOnly cookie set by the API; every call sends it (`credentials: "include"`). */
class Auth extends GlobalService {
	login = async ({ body, signal }: SignInConfig) => {
		const { payload } = await this.api.post<typeof body, unknown>("/auth/login", body, this.call(signal));

		return this.parsed(AuthSchema.User, payload);
	};

	register = async ({ body, signal }: SignUpConfig) => {
		const { payload } = await this.api.post<typeof body, unknown>("/auth/register", body, this.call(signal));

		return this.parsed(AuthSchema.User, payload);
	};

	logout = async ({ signal }: ReadConfig = {}) => {
		await this.api.post<object, unknown>("/auth/logout", {}, this.call(signal));
	};

	me = async ({ signal }: ReadConfig = {}) => {
		const { payload } = await this.api.get<unknown>("/auth/me", this.call(signal));

		return this.parsed(AuthSchema.User, payload);
	};
}

export const auth = new Auth();
