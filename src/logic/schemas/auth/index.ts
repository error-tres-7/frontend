import { z } from "zod";

export const ROLES = ["cliente", "comerciante"] as const;

class AuthSchemas {
	/** The signed-in person as the API answers it (backend `/auth/*`). */
	User = z.object({
		id_usuario: z.number().int(),
		nombre: z.string(),
		correo: z.string(),
		rol: z.enum(ROLES),
	});

	SignIn = z.object({
		correo: z.string().trim().pipe(z.email("Escribe un correo válido.")),
		contrasena: z.string().min(1, "Escribe tu contraseña."),
	});

	SignUp = z.object({
		nombre: z.string().trim().min(2, "Escribe tu nombre.").max(100, "Nombre: máximo 100 caracteres."),
		correo: z.string().trim().max(100, "Correo: máximo 100 caracteres.").pipe(z.email("Escribe un correo válido.")),
		contrasena: z.string().min(8, "Usa al menos 8 caracteres."),
		rol: z.enum(ROLES),
	});
}

export const AuthSchema = new AuthSchemas();
