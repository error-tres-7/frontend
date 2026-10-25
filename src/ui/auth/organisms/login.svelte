<script lang="ts">
	import { auth_failure_message } from "#lib/auth/errors.js";
	import { AuthSchema } from "#schemas/auth/index.js";
	import { auth } from "#services/auth/index.js";
	import * as Field from "#sharing/molecules/field/index.js";
	import { createAppForm } from "#sharing/organisms/form/index.js";
	import type { SignInInput, User } from "#typing/schemas/auth.js";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";

	let failure = $state("");

	const defaults: SignInInput = { correo: "", contrasena: "" };
	const form = createAppForm(() => ({
		defaultValues: defaults,
		validators: { onSubmit: AuthSchema.SignIn },
		onSubmit: async ({ value }) => {
			failure = "";
			let user: User;
			try {
				user = await auth.login({ body: AuthSchema.SignIn.parse(value) });
			} catch (error) {
				failure = auth_failure_message(error);
				return;
			}
			await goto(user.rol === "comerciante" ? resolve("/(merchants)/negocio") : resolve("/(customers)"));
		},
	}));
</script>

<svelte:head><title>Iniciar sesión · entrepuestos</title></svelte:head>
<main id="contenido" class="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 px-6 py-12">
	<a href={resolve("/(customers)")} class="text-sm font-semibold">entrepuestos</a>
	<h1 class="text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
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
			<form.AppField name="correo">
				{#snippet children(field)}
					<field.Input label="Correo" type="email" autocomplete="email" inputmode="email" />
				{/snippet}
			</form.AppField>
			<form.AppField name="contrasena">
				{#snippet children(field)}
					<field.Input label="Contraseña" type="password" autocomplete="current-password" />
				{/snippet}
			</form.AppField>
			{#if failure}
				<p role="alert" class="text-sm text-destructive">{failure}</p>
			{/if}
			<form.AppForm>
				<form.Submit pending="Entrando…">Entrar</form.Submit>
			</form.AppForm>
		</Field.Group>
	</form>
	<p class="text-sm text-muted-foreground">
		¿No tienes cuenta?
		<a href={resolve("/(auth)/registro")} class="font-semibold text-foreground underline">Crea una</a>
	</p>
</main>
