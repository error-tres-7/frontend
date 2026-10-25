<script lang="ts">
	import "@fontsource-variable/bricolage-grotesque";
	import "@fontsource-variable/dm-sans";
	import { LayoutDashboard, LogOut, Package, ShoppingBag, Store, Wallet } from "@lucide/svelte";
	import { createQuery, useQueryClient } from "@tanstack/svelte-query";
	import type { Snippet } from "svelte";
	import { sign_out } from "#lib/auth/session.js";
	import { set_merchant } from "#lib/merchant/context.js";
	import { merchant_queries } from "#lib/merchant/queries.js";
	import StatusBadge from "#merchants/molecules/status-badge.svelte";
	import SaleDialog from "#merchants/organisms/sale-dialog.svelte";
	import { iso_day } from "#utils/format.js";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";

	let { children }: { children: Snippet } = $props();

	const client = useQueryClient();
	const today = iso_day();
	let selling = $state(false);
	let leaving = $state(false);

	async function logout() {
		leaving = true;
		try {
			await sign_out(client);
			await goto(resolve("/(customers)"));
		} catch {
			announcement = "No pudimos cerrar tu sesión. Inténtalo de nuevo.";
		} finally {
			leaving = false;
		}
	}
	let announcement = $state("");
	let shell = $state<HTMLElement>();

	set_merchant({
		today,
		register_sale: () => {
			selling = true;
		},
		get portal() {
			return shell;
		},
	});

	const profile = createQuery(() => merchant_queries.profile());
	const orders = createQuery(() => merchant_queries.orders(today));
	let pending = $derived(orders.data?.filter((order) => order.status === "pending").length ?? 0);

	const sections = [
		{ href: resolve("/(merchants)/negocio"), label: "Resumen", icon: LayoutDashboard, also: ["/negocio/precios"] },
		{ href: resolve("/(merchants)/negocio/pedidos"), label: "Pedidos", icon: ShoppingBag, also: [] },
		{ href: resolve("/(merchants)/negocio/productos"), label: "Productos", icon: Package, also: [] },
		{ href: resolve("/(merchants)/negocio/finanzas"), label: "Finanzas", icon: Wallet, also: [] },
		{ href: resolve("/(merchants)/negocio/puesto"), label: "Mi puesto", icon: Store, also: [] },
	];

	function current(section: (typeof sections)[number]) {
		const path = page.url.pathname.replace(/\/$/, "") || "/";
		return path === section.href || section.also.some((prefix) => path.startsWith(prefix));
	}
</script>

<div class="merchant" bind:this={shell}>
	<a class="skip-link" href="#contenido-negocio">Saltar al contenido</a>

	<aside class="sidebar" aria-label="Tu negocio">
		<a class="wordmark" href={resolve("/(merchants)/negocio")} aria-label="entrepuestos, resumen de tu negocio"
			>entrepuestos</a
		>
		<div class="business">
			<span class="eyebrow">Tu negocio</span>
			<strong>{profile.data?.name ?? "Tu puesto"}</strong>
			{#if profile.data}
				<span class="place">
					{[profile.data.market_name, profile.data.stall && `Local ${profile.data.stall}`].filter(Boolean).join(" · ")}
				</span>
			{/if}
		</div>
		<nav aria-label="Secciones del negocio">
			<ul>
				{#each sections as section (section.href)}
					{@const Icon = section.icon}
					<li>
						<a href={section.href} aria-current={current(section) ? "page" : undefined}>
							<Icon size={20} aria-hidden="true" />
							{section.label}
							{#if section.label === "Pedidos" && pending}
								<span class="count"
									><span aria-hidden="true">{pending}</span><span class="sr-only">, {pending} por confirmar</span></span
								>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
		{#if profile.data}
			<div class="account">
				{#if profile.data.photo_url}
					<img src={profile.data.photo_url} alt="" width="40" height="40">
				{:else}
					<span class="avatar" aria-hidden="true">{profile.data.account_name.charAt(0)}</span>
				{/if}
				<span>{profile.data.account_name}</span>
			</div>
		{/if}
		<button type="button" class="logout" class:alone={!profile.data} disabled={leaving} onclick={logout}>
			<LogOut size={18} aria-hidden="true" />
			{leaving ? "Cerrando sesión…" : "Cerrar sesión"}
		</button>
	</aside>

	<div class="workspace">
		<header class="mobile-bar">
			<a class="wordmark" href={resolve("/(merchants)/negocio")} aria-label="entrepuestos, resumen de tu negocio"
				>entrepuestos</a
			>
			<div class="mobile-actions">
				{#if profile.data}
					<StatusBadge tone={profile.data.open ? "ok" : "muted"}>
						{profile.data.open ? "Puesto abierto" : "Cerrado por hoy"}
					</StatusBadge>
				{/if}
				<button
					type="button"
					class="mobile-logout"
					disabled={leaving}
					onclick={logout}
					aria-label={leaving ? "Cerrando sesión" : "Cerrar sesión"}
				>
					<LogOut size={20} aria-hidden="true" />
				</button>
			</div>
		</header>
		<div class="topbar">
			{#if profile.data}
				<StatusBadge tone={profile.data.open ? "ok" : "muted"}>
					{profile.data.open ? "Puesto abierto" : "Cerrado por hoy"}
				</StatusBadge>
			{/if}
		</div>
		<main id="contenido-negocio" tabindex="-1">{@render children()}</main>
	</div>

	<nav class="bottom-nav" aria-label="Secciones del negocio, móvil">
		{#each sections as section (section.href)}
			{@const Icon = section.icon}
			<a href={section.href} aria-current={current(section) ? "page" : undefined}>
				<span class="icon">
					<Icon size={22} aria-hidden="true" />
					{#if section.label === "Pedidos" && pending}
						<span class="dot"
							><span aria-hidden="true">{pending}</span><span class="sr-only">, {pending} por confirmar</span></span
						>
					{/if}
				</span>
				{section.label}
			</a>
		{/each}
	</nav>

	<p class="sr-only" role="status" aria-live="polite">{announcement}</p>
	{#if announcement}
		<div class="toast" aria-hidden="true">{announcement}</div>
	{/if}

	<SaleDialog
		bind:open={selling}
		{today}
		onsaved={(message) => {
			announcement = message;
			setTimeout(() => {
				if (announcement === message) announcement = "";
			}, 5000);
		}}
	/>
</div>

<style>
	.merchant {
		--ink: #123c32;
		--leaf: #155641;
		--tomato: #b83d2a;
		--lime: #e3f09a;
		--mist: #f5f7f6;
		--line: #dae2dd;
		--mint: #eaf1ed;
		--sage: #c5d6c8;
		--muted-ink: #54615c;
		--muted-bg: #eef1ef;
		--warn-bg: #fff2cf;
		--warn: #8a570a;
		--alert-bg: #fbe5e1;
		--night-text: #c3d7cc;
		--background: var(--mist);
		--foreground: var(--ink);
		--card: #ffffff;
		--card-foreground: var(--ink);
		--popover: #ffffff;
		--popover-foreground: var(--ink);
		--primary: var(--leaf);
		--primary-foreground: #ffffff;
		--secondary: var(--mint);
		--secondary-foreground: var(--ink);
		--muted: var(--mint);
		--muted-foreground: var(--muted-ink);
		--accent: var(--mint);
		--accent-foreground: var(--ink);
		--destructive: var(--tomato);
		--border: var(--line);
		--input: var(--line);
		--ring: var(--leaf);
		--font-heading: "Bricolage Grotesque Variable", system-ui, sans-serif;
		--font-body: "DM Sans Variable", system-ui, sans-serif;

		display: grid;
		grid-template-columns: 1fr;
		min-height: 100svh;
		background: var(--background);
		color: var(--foreground);
		font-family: var(--font-body);
	}

	/* Shared primitives at the design's sizes: 44–48px controls, 8px radius. */
	.merchant :global([data-slot="input"]),
	.merchant :global([data-slot="select"]) {
		height: 48px;
		border-radius: 8px;
		background: var(--card);
		padding-inline: 0.875rem;
		font-size: 1rem;
	}
	.merchant :global(.pl-10[data-slot="input"]) {
		padding-left: 2.5rem;
	}
	.merchant :global([data-slot="button"]) {
		min-height: 44px;
		border-radius: 8px;
		padding-inline: 1.125rem;
		font-size: 0.9375rem;
		font-weight: 600;
		gap: 0.5rem;
	}
	.merchant :global([data-slot="button"] svg:not([class*="size-"])) {
		width: 18px;
		height: 18px;
	}
	.merchant :global([data-slot="field-label"]),
	.merchant :global([data-slot="field-legend"]) {
		color: var(--ink);
		font-size: 0.8125rem;
		font-weight: 600;
	}
	.merchant :global(.merchant-dialog) {
		max-width: min(30rem, calc(100% - 2rem));
		padding: 1.5rem;
		border-radius: 12px;
		font-family: var(--font-body);
		color: var(--ink);
	}
	.merchant :global([data-slot="dialog-title"]) {
		font: 700 1.5rem var(--font-heading);
	}
	.merchant :global(.card) {
		border-radius: 12px;
		background: var(--card);
	}
	.merchant :global(.tint) {
		border-radius: 12px;
		background: var(--mint);
	}

	/* Keep focused and scrolled-to controls clear of the fixed mobile bars. */
	:global(html:has(.merchant)) {
		scroll-padding: 76px 0 96px;
	}
	@media (min-width: 1024px) {
		:global(html:has(.merchant)) {
			scroll-padding: 0;
		}
	}
	.skip-link {
		position: fixed;
		top: -100px;
		left: 1rem;
		z-index: 100;
		padding: 1rem;
		border-radius: 8px;
		background: var(--primary);
		color: var(--primary-foreground);
	}
	.skip-link:focus {
		top: 1rem;
	}
	.wordmark {
		font: 700 2rem / 1 var(--font-heading);
		letter-spacing: -0.03em;
		white-space: nowrap;
	}

	.sidebar {
		display: none;
	}
	.workspace {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding-bottom: 5.5rem;
	}
	.mobile-bar {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		height: 60px;
		padding-inline: 1.25rem;
		background: var(--card);
		border-bottom: 1px solid var(--line);
	}
	.mobile-bar .wordmark {
		font-size: 1.625rem;
	}
	.mobile-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.mobile-logout {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 8px;
		color: var(--muted-ink);
	}
	.mobile-logout:hover {
		background: var(--mint);
	}
	.logout {
		display: none;
	}
	.topbar {
		display: none;
	}
	main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 1200px;
		padding: 1.25rem 1.25rem 2rem;
		outline: none;
	}

	.bottom-nav {
		position: fixed;
		inset: auto 0 0;
		z-index: 10;
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		padding: 0.5rem 0.25rem calc(0.5rem + env(safe-area-inset-bottom));
		background: var(--card);
		border-top: 1px solid var(--line);
	}
	.bottom-nav a {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		min-height: 48px;
		color: var(--muted-ink);
		font-size: 0.6875rem;
		font-weight: 500;
	}
	.bottom-nav a[aria-current="page"] {
		color: var(--leaf);
		font-weight: 700;
	}
	.bottom-nav .icon {
		position: relative;
		display: flex;
	}
	.dot {
		position: absolute;
		top: -6px;
		right: -10px;
		min-width: 18px;
		padding: 1px 4px;
		border-radius: 9px;
		background: var(--leaf);
		color: #fff;
		font-size: 0.6875rem;
		font-weight: 700;
		text-align: center;
	}

	@media (min-width: 1024px) {
		.merchant {
			grid-template-columns: 238px minmax(0, 1fr);
		}
		.sidebar {
			position: sticky;
			top: 0;
			display: flex;
			flex-direction: column;
			gap: 28px;
			height: 100svh;
			padding: 30px 20px;
			overflow-y: auto;
			background: var(--ink);
			color: #fff;
		}
		.sidebar .wordmark {
			color: #fff;
			font-size: 1.875rem;
		}
		.business {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			padding-block: 1.125rem;
		}
		.eyebrow {
			color: #a8c8b9;
			font-size: 0.625rem;
			font-weight: 700;
			letter-spacing: 0.12em;
			text-transform: uppercase;
		}
		.business strong {
			font-size: 1.1875rem;
		}
		.place {
			color: var(--night-text);
			font-size: 0.75rem;
		}
		.sidebar ul {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			margin: 0;
			padding: 0;
			list-style: none;
		}
		.sidebar nav a {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			height: 48px;
			padding-inline: 0.875rem;
			border-radius: 8px;
			color: #fff;
			font-size: 0.9375rem;
			font-weight: 500;
		}
		.sidebar nav a :global(svg) {
			color: var(--night-text);
		}
		.sidebar nav a:hover {
			background: #1b4a3e;
		}
		.sidebar nav a[aria-current="page"] {
			background: var(--lime);
			color: var(--ink);
			font-weight: 700;
		}
		.sidebar nav a[aria-current="page"] :global(svg) {
			color: var(--ink);
		}
		.count {
			padding: 3px 6px;
			border-radius: 4px;
			background: #2c584b;
			color: var(--lime);
			font-size: 0.6875rem;
			font-weight: 700;
		}
		[aria-current="page"] .count {
			background: var(--ink);
		}
		.account {
			display: flex;
			align-items: center;
			gap: 0.625rem;
			margin-top: auto;
			font-size: 0.8125rem;
			font-weight: 600;
		}
		.account img,
		.avatar {
			width: 40px;
			height: 40px;
			border-radius: 50%;
			object-fit: cover;
		}
		.avatar {
			display: grid;
			place-items: center;
			background: var(--leaf);
		}
		.logout {
			display: flex;
			align-items: center;
			gap: 0.625rem;
			min-height: 44px;
			padding-inline: 0.875rem;
			border-radius: 8px;
			color: var(--night-text);
			font-size: 0.8125rem;
			font-weight: 600;
		}
		.logout.alone {
			margin-top: auto;
		}
		.logout:hover {
			background: #1b4a3e;
			color: #fff;
		}
		.workspace {
			padding-bottom: 0;
		}
		.mobile-bar,
		.bottom-nav {
			display: none;
		}
		.topbar {
			display: flex;
			align-items: center;
			min-height: 40px;
			padding: 24px 32px 0;
		}
		main {
			padding: 1rem 2rem 3rem;
		}
	}

	.toast {
		position: fixed;
		left: 50%;
		bottom: 6rem;
		z-index: 60;
		transform: translateX(-50%);
		max-width: calc(100% - 2rem);
		padding: 0.75rem 1.25rem;
		border-radius: 8px;
		background: var(--ink);
		color: #fff;
		font-size: 0.9375rem;
		font-weight: 600;
		box-shadow: 0 8px 24px rgb(18 60 50 / 0.2);
	}
	@media (min-width: 1024px) {
		.toast {
			bottom: 2rem;
		}
	}
</style>
