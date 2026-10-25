<script lang="ts">
	import { auth_failure_message } from "#lib/auth/errors.js";
	import { AuthSchema } from "#schemas/auth/index.js";
	import { auth } from "#services/auth/index.js";
	import * as Field from "#sharing/molecules/field/index.js";
	import { createAppForm } from "#sharing/organisms/form/index.js";
	import type { SignUpInput, SignUpValues, User } from "#typing/schemas/auth.js";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";

	let failure = $state("");

	const roles = [
		{ value: "cliente", label: "Cliente", hint: "Aparto productos en los mercados." },
		{ value: "comerciante", label: "Comerciante", hint: "Vendo en un puesto o local." },
	] as const;

	const defaults: SignUpInput = { nombre: "", correo: "", contrasena: "", rol: "cliente" };
	const form = createAppForm(() => ({
		defaultValues: defaults,
		validators: { onSubmit: AuthSchema.SignUp },
		onSubmit: async ({ value }) => {
			failure = "";
			const body: SignUpValues = AuthSchema.SignUp.parse(value);
			let user: User;
			try {
				await auth.register({ body });
				// Registering does not open a session; sign in with the same credentials.
				user = await auth.login({ body: { correo: body.correo, contrasena: body.contrasena } });
			} catch (error) {
				failure = auth_failure_message(error);
				return;
			}
			await goto(user.rol === "comerciante" ? resolve("/(merchants)/negocio") : resolve("/(customers)"));
		},
	}));
</script>

<svelte:head><title>Crear cuenta · entrepuestos</title></svelte:head>
<main id="contenido" class="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 px-6 py-12">
	<a href={resolve("/(customers)")} class="text-sm font-semibold">entrepuestos</a>
	<h1 class="text-3xl font-semibold tracking-tight">Crear cuenta</h1>
	<!-- POST so a submit before hydration never puts the password in the URL. -->
	<form
		method="post"
		novalidate
		onsubmit={async (event) => {
			event.preventDefault();
			const element = event.currentTarget;
			await form.handleSubmit();
			if (!form.state.isValid) element.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
		}}
	>
		<Field.Group class="gap-4">
			<form.AppField name="nombre">
				{#snippet children(field)}
					<field.Input label="Nombre" autocomplete="name" maxlength={100} />
				{/snippet}
			</form.AppField>
			<form.AppField name="correo">
				{#snippet children(field)}
					<field.Input label="Correo" type="email" autocomplete="email" inputmode="email" maxlength={100} />
				{/snippet}
			</form.AppField>
			<form.AppField name="contrasena">
				{#snippet children(field)}
					<field.Input
						label="Contraseña"
						type="password"
						autocomplete="new-password"
						description="Al menos 8 caracteres."
					/>
				{/snippet}
			</form.AppField>
			<form.AppField name="rol">
				{#snippet children(field)}
					<field.Choices legend="Me registro como" options={roles} variant="card" />
				{/snippet}
			</form.AppField>
			{#if failure}
				<p role="alert" class="text-sm text-destructive">{failure}</p>
			{/if}
			<form.AppForm>
				<form.Submit pending="Creando cuenta…">Crear cuenta</form.Submit>
			</form.AppForm>
		</Field.Group>
	</form>
	<p class="text-sm text-muted-foreground">
		¿Ya tienes cuenta?
		<a href={resolve("/(auth)/login")} class="font-semibold text-foreground underline">Inicia sesión</a>
	</p>
</main>
