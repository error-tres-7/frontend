import { failure_status } from "#services/global/index.js";

/** What a person can do about a failed call, in Spanish; the action names what failed. */
export function failure_message(failure: unknown, action: string) {
	const status = failure_status(failure);
	if (status === null) return `${action}. Revisa tu conexión e inténtalo de nuevo.`;
	if (status === 401 || status === 403) return `${action}. Tu sesión no tiene acceso a este negocio.`;
	if (status === 404) return `${action}. No encontramos este registro; puede haber cambiado.`;
	if (status === 409) return `${action}. El registro cambió mientras lo editabas; recarga para ver lo más reciente.`;
	if (status === 422) return `${action}. Revisa los datos e inténtalo de nuevo.`;
	return `${action}. El servicio no respondió como esperábamos; inténtalo de nuevo.`;
}
