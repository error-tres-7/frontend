<script lang="ts">
	import { createQuery, useQueryClient } from "@tanstack/svelte-query";
	import type { Snippet } from "svelte";
	import { auth_queries, sign_out } from "#lib/auth/session.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";

	let { children }: { children: Snippet } = $props();

	const client = useQueryClient();
	const session = createQuery(() => auth_queries.me());
	let leaving = $state(false);

	// Without a session, sign in first and come back to the same page.
	$effect(() => {
		if (session.isSuccess && session.data === null) {
			const next = encodeURIComponent(`${page.url.pathname}${page.url.search}`);
			void goto(`${resolve("/(auth)/login")}?next=${next}`, { replaceState: true });
		}
	});

	async function switch_account() {
		leaving = true;
		try {
			await sign_out(client);
		} finally {
			leaving = false;
		}
		await goto(`${resolve("/(auth)/login")}?next=${encodeURIComponent(page.url.pathname)}`);
	}
</script>

{#if session.data?.rol === "comerciante"}
	{@render children()}
{:else}
	<main id="contenido-negocio" class="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 px-6 py-12">
		<a href={resolve("/(customers)")} class="text-sm font-semibold">entrepuestos</a>
		{#if session.data}
			<h1 class="text-2xl font-semibold tracking-tight">Este espacio es para comerciantes</h1>
			<p class="text-muted-foreground">
				Entraste como {session.data.nombre}, con una cuenta de cliente. Para administrar un puesto, entra con una cuenta
				de comerciante.
			</p>
			<div class="flex flex-wrap gap-3">
				<Button href={resolve("/(customers)")}>Seguir comprando</Button>
				<Button variant="outline" disabled={leaving} onclick={switch_account}>
					{leaving ? "Cerrando sesión…" : "Cambiar de cuenta"}
				</Button>
			</div>
		{:else if session.isError}
			<h1 class="text-2xl font-semibold tracking-tight">No pudimos revisar tu sesión</h1>
			<p class="text-muted-foreground">Revisa tu conexión e inténtalo de nuevo.</p>
			<div><Button onclick={() => session.refetch()}>Reintentar</Button></div>
		{:else}
			<p role="status" class="text-muted-foreground">Revisando tu sesión…</p>
		{/if}
	</main>
{/if}
