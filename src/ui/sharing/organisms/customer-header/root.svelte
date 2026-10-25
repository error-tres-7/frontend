<script lang="ts">
	import { Heart, LogOut, ShoppingBag, Store, UserRound } from "@lucide/svelte";
	import { createQuery, useQueryClient } from "@tanstack/svelte-query";
	import { auth_queries, sign_out } from "#lib/auth/session.js";
	import { get_customer } from "#lib/customer/context.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";

	const customer = get_customer();
	const client = useQueryClient();
	const session = createQuery(() => auth_queries.me());
	let leaving = $state(false);
	let failure = $state("");

	async function logout() {
		leaving = true;
		failure = "";
		try {
			await sign_out(client);
			await goto(resolve("/(customers)"));
		} catch {
			failure = "No pudimos cerrar tu sesión. Inténtalo de nuevo.";
		} finally {
			leaving = false;
		}
	}
</script>

<a class="skip-link" href="#contenido">Saltar al contenido</a>
<header class="border-b border-border bg-card">
	<div class="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
		<a href={resolve("/(customers)")} class="wordmark" aria-label="entrepuestos, inicio">entrepuestos</a>
		<nav aria-label="Navegación principal" class="ml-auto flex items-center gap-1 sm:gap-3">
			<div class="hidden items-center gap-5 md:flex">
				<a href={resolve("/(merchants)/negocio")} class="audience"><Store size={16} /> Soy comerciante</a>
				<a href={resolve("/(customers)")} class="audience"><UserRound size={16} /> Soy cliente</a>
			</div>
			<Button
				variant="ghost"
				size="icon"
				class="hidden size-11 md:inline-flex"
				href={resolve("/(customers)/favoritos")}
				aria-label={`Favoritos${customer.favorites.length ? `, ${customer.favorites.length}` : ""}`}
				aria-current={page.url.pathname === "/favoritos" ? "page" : undefined}
				><Heart /></Button
			>
			<Button
				variant="ghost"
				size="icon"
				class="relative hidden size-11 md:inline-flex"
				href={resolve("/(customers)/carrito")}
				aria-label={`Carrito${customer.cart_count ? `, ${customer.cart_count} productos` : ""}`}
				aria-current={page.url.pathname === "/carrito" ? "page" : undefined}
			>
				<ShoppingBag />
				{#if customer.cart_count}
					<span
						class="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground"
						>{customer.cart_count}</span
					>
				{/if}
			</Button>
			{#if session.data}
				{#if session.data.rol === "comerciante"}
					<Button href={resolve("/(merchants)/negocio")} class="min-h-11 px-3 sm:px-5">Mi negocio</Button>
				{/if}
				<span class="account" title={session.data.correo}>
					<span class="avatar" aria-hidden="true">{session.data.nombre.charAt(0)}</span>
					<span class="hidden lg:inline">{session.data.nombre.split(" ")[0]}</span>
				</span>
				<Button
					variant="ghost"
					size="icon"
					class="size-11"
					disabled={leaving}
					onclick={logout}
					aria-label={leaving ? "Cerrando sesión" : `Cerrar sesión de ${session.data.nombre}`}
					><LogOut /></Button
				>
			{:else}
				<Button href={resolve("/(auth)/login")} class="min-h-11 px-3 sm:px-5">Iniciar sesión</Button>
			{/if}
		</nav>
	</div>
	<nav aria-label="Tipo de usuario" class="flex gap-2 px-4 pb-3 md:hidden">
		<a class="mobile-audience" href={resolve("/(merchants)/negocio")}><Store size={16} /> Soy comerciante</a>
		<a class="mobile-audience selected" href={resolve("/(customers)")}><UserRound size={16} /> Soy cliente</a>
		<Button variant="ghost" size="icon" class="size-11" href={resolve("/(customers)/favoritos")} aria-label="Favoritos"
			><Heart /></Button
		>
		<Button
			variant="ghost"
			size="icon"
			class="size-11"
			href={resolve("/(customers)/carrito")}
			aria-label={customer.cart_count ? `Carrito, ${customer.cart_count} productos` : "Carrito"}
			><ShoppingBag /></Button
		>
	</nav>
	{#if failure}
		<p role="alert" class="px-5 pb-3 text-sm text-destructive sm:px-8 lg:px-12">{failure}</p>
	{/if}
</header>

<style>
	.wordmark {
		font: 750 2rem var(--font-heading);
		letter-spacing: -0.04em;
		white-space: nowrap;
	}
	.audience {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
		min-height: 44px;
		font-size: 0.8125rem;
		font-weight: 600;
	}
	.audience:hover {
		text-decoration: underline;
	}
	.account {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
	}
	.avatar {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--accent, #e3f09a);
		font-size: 0.8125rem;
		font-weight: 700;
	}
	.mobile-audience {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		min-height: 44px;
		font-size: 0.8125rem;
		font-weight: 600;
	}
	.mobile-audience.selected {
		background: var(--muted);
	}
	.skip-link {
		position: fixed;
		top: -100px;
		left: 1rem;
		z-index: 10000;
		padding: 1rem;
		background: var(--primary);
		color: var(--primary-foreground);
		border-radius: 8px;
	}
	.skip-link:focus {
		top: 1rem;
	}
	@media (max-width: 767px) {
		header > div {
			height: 64px;
			gap: 0.5rem;
		}
		.wordmark {
			font-size: 1.5rem;
		}
	}
</style>
