import { CustomError, Http, ServiceError } from "@tuentyfaiv/http";
import type { z } from "zod";
import { API_URL } from "$app/env/public";

/** Without a configured API, calls go to the same origin, where a proxy or the backend can answer. */
export const API_BASE = API_URL ?? "/api";

/** Turns a refused answer into a `ServiceError` carrying the service's status and message. */
const thrower = ({ json, response }: { json: Record<string, unknown>; response: Response }) => {
	if (response.ok) return;

	const error = json?.error as { code?: string; message?: string } | undefined;

	throw new ServiceError({
		status: response.status,
		message: (json?.message as string | undefined) ?? error?.message ?? "api-error",
		errors: (json?.errors as string[] | undefined) ?? error?.code ?? "api-error",
		statusText: response.statusText,
	});
};

export class GlobalService {
	protected api = Http.create(API_BASE);

	/** Fresh headers, error mapping and cancellation for one call. */
	protected call = (signal?: AbortSignal, key?: string) => {
		const headers = new Headers({ Accept: "application/json" });

		if (key) headers.set("Idempotency-Key", key);

		return { headers, thrower, signal };
	};

	/** Validates what the API answered; a mismatch is a contract failure, not data to render. */
	protected parsed = <S extends z.ZodType>(schema: S, payload: unknown): z.output<S> => {
		const result = schema.safeParse(payload);

		if (!result.success) {
			throw new ServiceError({
				status: 502,
				message: "invalid-response",
				errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
				statusText: "Invalid response",
			});
		}

		return result.data;
	};
}

/** HTTP status of a failed call, or `null` when the request never got an answer (offline, cancelled). */
export function failure_status(failure: unknown): number | null {
	if (failure instanceof ServiceError) return failure.view().status;
	return null;
}

export function cancelled(failure: unknown) {
	return failure instanceof CustomError && failure.name.includes("AbortError");
}
