<script lang="ts">
	import { ArrowLeft, Heart, MapPin } from "@lucide/svelte";
	import EmptyState from "#home/molecules/empty-state.svelte";
	import { get_customer } from "#lib/customer/context.js";
	import type { Market } from "#lib/markets/index.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import { resolve } from "$app/paths";

	let {
		market,
		source,
	}: { market: Market; source: { url: string; title: string; license: string; imported_at: string } } = $props();
	const customer = get_customer();
</script>

<svelte:head
	><title>{market.name} · entrepuestos</title>
	<meta
		name="description"
		content={`Información del directorio de mercados públicos: ${market.name}, ${market.borough}.`}
	></svelte:head
>
<main>
	<a href={resolve("/(customers)")} class="back"><ArrowLeft size={16} /> Volver al mapa</a>
	<header>
		<div>
			<p class="eyebrow">Directorio de mercados públicos</p>
			<h1>{market.name}</h1>
			<p>{market.neighborhood} · {market.borough}</p>
		</div>
		<button
			type="button"
			aria-label={`${customer.favorites.includes(market.id) ? "Quitar" : "Guardar"} ${market.name} en favoritos`}
			aria-pressed={customer.favorites.includes(market.id)}
			onclick={() => customer.toggle_favorite(market.id)}
		>
			<Heart size={22} fill={customer.favorites.includes(market.id) ? "currentColor" : "none"} />
		</button>
	</header>
	<p class="address"><MapPin size={18} /> {market.address || "Dirección no disponible en el registro"}</p>
	{#if market.stalls !== null}
		<p class="detail">Locales registrados en la fuente: {market.stalls}. No indica locales abiertos hoy.</p>
	{/if}
	<EmptyState
		title="Aún no hay un catálogo de comerciantes"
		description="Este registro proviene del directorio público. No contamos con productos, precios, horarios, disponibilidad ni métodos de pago verificados para este mercado."
		><Button variant="outline" href={resolve("/(customers)/mercados/[id]", { id: "medellin" })}
			>Conocer el catálogo de ejemplo</Button
		></EmptyState
	>
	<section class="source">
		<h2>Fuente del registro</h2>
		<a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
		<p>Licencia: {source.license}</p>
		<p>Importación: {source.imported_at}</p>
		<p>La presencia en el directorio no implica afiliación a entrepuestos ni un catálogo en vivo.</p>
	</section>
</main>

<style>
	main {
		max-width: 1000px;
		margin: auto;
		padding: 2rem 1.5rem 4rem;
		color: var(--foreground);
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		color: var(--primary);
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin: 2rem 0 1rem;
	}
	h1 {
		font: 750 clamp(1.7rem, 4vw, 2.5rem) var(--font-heading);
		margin: 0.4rem 0;
	}
	p {
		color: var(--muted-foreground);
		font-size: 0.85rem;
		line-height: 1.6;
	}
	.eyebrow {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--primary);
	}
	button {
		min-width: 2.75rem;
		min-height: 2.75rem;
		border-radius: 50%;
		display: grid;
		place-items: center;
		border: 1px solid var(--border);
		background: white;
		color: var(--primary);
		cursor: pointer;
	}
	.address {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.detail {
		margin-bottom: 1.5rem;
	}
	.source {
		margin-top: 2rem;
		border-top: 1px solid var(--border);
		padding-top: 1.5rem;
	}
	h2 {
		font: 700 1.1rem var(--font-heading);
	}
	.source a {
		font-size: 0.85rem;
		text-decoration: underline;
		color: var(--primary);
	}
	.source p {
		font-size: 0.75rem;
	}
</style>
