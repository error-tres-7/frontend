import { failure_status } from "#services/global/index.js";

/** What a person can do about a failed sign-in or sign-up, in Spanish. */
export function auth_failure_message(failure: unknown) {
	const status = failure_status(failure);
	if (status === null) return "No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.";
	if (status === 401) return "Correo o contraseña incorrectos.";
	if (status === 409) return "Ya existe una cuenta con ese correo. Inicia sesión.";
	if (status === 422) return "Revisa los datos e inténtalo de nuevo.";
	return "El servicio no respondió como esperábamos; inténtalo de nuevo.";
}
