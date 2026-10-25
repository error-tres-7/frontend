<script lang="ts">
	import { ArrowLeft, Heart, Store } from "@lucide/svelte";
	import EmptyState from "#home/molecules/empty-state.svelte";
	import Journey from "#home/organisms/catalog/journey.svelte";
	import MerchantCard from "#home/organisms/catalog/merchant-card.svelte";
	import { demo_merchants, type Merchant } from "#lib/customer/catalog.js";
	import { get_customer } from "#lib/customer/context.js";
	import { markets } from "#lib/markets/index.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import { resolve } from "$app/paths";

	const customer = get_customer();
	let selected = $state<Merchant | null>(null);
	let merchants = $derived(demo_merchants.filter((merchant) => customer.favorites.includes(merchant.id)));
	let saved_markets = $derived(markets.filter((market) => customer.favorites.includes(market.id)));
	let unknown = $derived(
		customer.favorites.filter(
			(id) =>
				id !== "medellin" &&
				!demo_merchants.some((merchant) => merchant.id === id) &&
				!markets.some((market) => market.id === id)
		)
	);
</script>

<svelte:head><title>Mis favoritos · entrepuestos</title></svelte:head>
<main>
	<a class="back" href={resolve("/(customers)")}><ArrowLeft size={16} /> Volver al mapa</a>
	<h1>Mis favoritos</h1>
	<p class="intro">Tus puestos de confianza, siempre a la mano.</p>
	{#if !customer.favorites.length}
		<EmptyState
			title="Guarda lo que te gusta"
			description="Toca el corazón de un mercado o de un puesto de ejemplo para encontrarlo aquí. No necesitas una cuenta."
			><Button href={resolve("/(customers)")}>Explorar mercados</Button
			><Button variant="outline" href={resolve("/(customers)/mercados/[id]", { id: "medellin" })}
				>Conocer el catálogo de ejemplo</Button
			></EmptyState
		>
	{:else}
		{#if merchants.length}
			<h2>Puestos · {merchants.length}</h2>
			<p class="note">Catálogo de ejemplo · Demostración · no envía pedidos</p>
			<div class="merchants">
				{#each merchants as merchant (merchant.id)}
					<MerchantCard {merchant} onopen={() => (selected = merchant)} />
				{/each}
			</div>
		{/if}
		{#if saved_markets.length || customer.favorites.includes("medellin")}
			<h2>Mercados</h2>
			<div class="markets">
				{#if customer.favorites.includes("medellin")}
					<article>
						<Store size={22} />
						<div>
							<a href={resolve("/(customers)/mercados/[id]", { id: "medellin" })}>Mercado Medellín</a>
							<p>Catálogo de ejemplo · No envía pedidos</p>
						</div>
						<button
							type="button"
							aria-label="Quitar Mercado Medellín de favoritos"
							onclick={() => customer.toggle_favorite("medellin")}
						>
							<Heart size={20} fill="currentColor" />
						</button>
					</article>
				{/if}
				{#each saved_markets as market (market.id)}
					<article>
						<Store size={22} />
						<div>
							<a href={resolve("/(customers)/mercados/[id]", { id: market.id })}>{market.name}</a>
							<p>{market.neighborhood} · {market.borough}</p>
						</div>
						<button
							type="button"
							aria-label={`Quitar ${market.name} de favoritos`}
							onclick={() => customer.toggle_favorite(market.id)}
						>
							<Heart size={20} fill="currentColor" />
						</button>
					</article>
				{/each}
			</div>
		{/if}
		{#each unknown as id (id)}
			<article>
				<div>
					<strong>Favorito no disponible</strong>
					<p>Este registro ya no está en el directorio actual.</p>
				</div>
				<Button variant="outline" onclick={() => customer.toggle_favorite(id)}>Quitar favorito</Button>
			</article>
		{/each}
	{/if}
	<p class="note" role={customer.storage_unavailable ? "status" : undefined}>
		{#if customer.storage_unavailable}
			Tu navegador no permite guardar cambios. Puedes continuar; el carrito y los favoritos durarán solo esta visita.
		{:else}
			Se guardan solo en este navegador.
		{/if}
		Un mercado guardado no implica que tenga un catálogo en vivo.
	</p>
</main>
{#if selected}
	{#key selected.id}
		<Journey merchant={selected} onclose={() => (selected = null)} />
	{/key}
{/if}

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
		color: var(--primary);
		font-size: 0.8rem;
	}
	h1 {
		font: 750 2rem var(--font-heading);
		letter-spacing: -0.04em;
		margin: 1.5rem 0 0.6rem;
	}
	h2 {
		font: 700 1.2rem var(--font-heading);
		margin: 2rem 0 1rem;
	}
	.intro {
		color: var(--muted-foreground);
		margin: 0 0 2rem;
	}
	.merchants,
	.markets {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}
	article {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: 0.7rem;
		background: white;
	}
	article > div {
		flex: 1;
		min-width: 0;
	}
	article a {
		font-weight: 700;
		text-decoration: underline;
		text-underline-offset: 0.2rem;
	}
	article p {
		color: var(--muted-foreground);
		font-size: 0.75rem;
		margin: 0.4rem 0 0;
	}
	button {
		display: grid;
		place-items: center;
		min-width: 2.75rem;
		min-height: 2.75rem;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--primary);
		cursor: pointer;
	}
	.note {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		line-height: 1.5;
		margin: 1rem 0;
	}
	@media (max-width: 640px) {
		.merchants,
		.markets {
			grid-template-columns: 1fr;
		}
		main {
			padding: 1.5rem 1rem 3rem;
		}
	}
</style>
