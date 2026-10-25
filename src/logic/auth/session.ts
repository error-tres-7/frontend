import type { QueryClient } from "@tanstack/query-core";
import { merchant_keys } from "#lib/merchant/keys.js";
import { auth } from "#services/auth/index.js";
import { failure_status } from "#services/global/index.js";
import type { User } from "#typing/schemas/auth.js";

export const auth_keys = {
	me: () => ["auth", "me"] as const,
};

/** The signed-in person, or `null` without a session: a 401 is an answer, not a failure. */
export const auth_queries = {
	me: () => ({
		queryKey: auth_keys.me(),
		queryFn: async ({ signal }: { signal: AbortSignal }): Promise<User | null> => {
			try {
				return await auth.me({ signal });
			} catch (failure) {
				if (failure_status(failure) === 401) return null;
				throw failure;
			}
		},
		retry: false,
		staleTime: 5 * 60_000,
	}),
};

/** Where a person lands after signing in when no `next` path was requested. */
export function home_path(user: Pick<User, "rol">) {
	return user.rol === "comerciante" ? "/negocio" : "/";
}

/** Only same-site absolute paths survive; `//host`, `/\host` and full URLs would leave the site. */
export function safe_next(value: string | null | undefined) {
	if (!value?.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
	return value;
}

/** The session now belongs to `user`; merchant data cached for a previous account must not show. */
export function signed_in(client: QueryClient, user: User) {
	client.removeQueries({ queryKey: merchant_keys.all });
	client.setQueryData(auth_keys.me(), user);
}

export async function sign_out(client: QueryClient) {
	await auth.logout();
	client.removeQueries({ queryKey: merchant_keys.all });
	client.setQueryData(auth_keys.me(), null);
}
