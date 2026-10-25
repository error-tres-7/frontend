<script lang="ts">
	import { ArrowLeft, Grid2X2, Heart, List } from "@lucide/svelte";
	import DemoNote from "#home/molecules/demo-note.svelte";
	import EmptyState from "#home/molecules/empty-state.svelte";
	import Search from "#home/molecules/search.svelte";
	import CartSummary from "#home/organisms/cart/cart-summary.svelte";
	import Journey from "#home/organisms/catalog/journey.svelte";
	import MerchantCard from "#home/organisms/catalog/merchant-card.svelte";
	import { type Merchant, money, search_merchants } from "#lib/customer/catalog.js";
	import { get_customer } from "#lib/customer/context.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import { resolve } from "$app/paths";

	const customer = get_customer();
	let selected = $state<Merchant | null>(null);
	let merchants = $derived(search_merchants(customer.query));
</script>

<svelte:head
	><title>Mercado Medellín · Catálogo de ejemplo · entrepuestos</title>
	<meta
		name="description"
		content="Explora el catálogo ilustrativo de Mercado Medellín. Demostración sin pedidos, reservas ni pagos reales."
	></svelte:head
>

<main>
	<a class="back" href={resolve("/(customers)")}><ArrowLeft size={16} /> Volver al mapa</a>
	<div class="heading">
		<div>
			<h1>Mercado Medellín</h1>
			<p>Roma Sur, Cuauhtémoc</p>
			<DemoNote />
		</div>
		<button
			class="favorite"
			type="button"
			aria-label="Guardar mercado de ejemplo en favoritos"
			aria-pressed={customer.favorites.includes("medellin")}
			onclick={() => customer.toggle_favorite("medellin")}
		>
			<Heart size={21} fill={customer.favorites.includes("medellin") ? "currentColor" : "none"} />
		</button>
	</div>
	<p class="intro">Encuentra lo que buscas, conoce a tu comerciante.</p>
	<div class="layout">
		<section aria-label="Comerciantes del mercado de ejemplo">
			<Search bind:value={customer.query} label="Buscar productos en este mercado" />
			<div class="results">
				<div>
					<h2>{customer.query.trim() ? `Resultados para “${customer.query}”` : "Los puestos de tu mercado"}</h2>
					<p aria-live="polite">{merchants.length} comerciantes de ejemplo</p>
				</div>
				<fieldset class="views" aria-label="Vista de comerciantes">
					<button type="button" aria-pressed={customer.view === "grid"} onclick={() => (customer.view = "grid")}>
						<Grid2X2 size={15} />
						Cuadrícula
					</button><button
						type="button"
						aria-pressed={customer.view === "list"}
						onclick={() => (customer.view = "list")}
					>
						<List size={15} />
						Lista
					</button>
				</fieldset>
			</div>
			{#if merchants.length}
				<div class={["merchants", customer.view]}>
					{#each merchants as merchant (merchant.id)}
						<MerchantCard
							{merchant}
							query={customer.query}
							list={customer.view === "list"}
							onopen={() => (selected = merchant)}
						/>
					{/each}
				</div>
			{:else}
				<EmptyState
					title="No encontramos ese producto"
					description="Prueba con jitomate, aguacate o cilantro. Este catálogo solo contiene productos ilustrativos."
					><Button variant="outline" onclick={() => (customer.query = "")}>Limpiar búsqueda</Button></EmptyState
				>
			{/if}
		</section>
		<div class="sidebar"><CartSummary /></div>
	</div>
	{#if customer.storage_unavailable}
		<p role="status" class="note">
			Tu navegador no permite guardar cambios. Puedes continuar; el carrito y los favoritos durarán solo esta visita.
		</p>
	{/if}
	<p class="note">
		Los puestos, precios, locales y métodos de pago de este recorrido son ficticios. No describen a los comerciantes
		reales de Mercado Medellín.
	</p>
	{#if customer.cart_count}
		<a class="mobile-cart" href={resolve("/(customers)/carrito")}
			><span>Ver carrito · {customer.cart_count}</span><strong>{money(customer.total)}</strong></a
		>
	{/if}
</main>
{#if selected}
	{#key selected.id}
		<Journey merchant={selected} onclose={() => (selected = null)} />
	{/key}
{/if}

<style>
	main {
		max-width: 1240px;
		margin: auto;
		padding: 2rem 1.5rem 6rem;
		color: var(--foreground);
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		color: var(--primary);
		margin-bottom: 1.5rem;
	}
	.heading {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	h1 {
		font: 750 clamp(1.7rem, 3vw, 2.4rem) var(--font-heading);
		margin: 0 0 0.5rem;
		letter-spacing: -0.04em;
	}
	.heading p {
		margin: 0 0 0.7rem;
		color: var(--muted-foreground);
		font-size: 0.85rem;
	}
	.favorite {
		min-width: 2.75rem;
		height: 2.75rem;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: white;
		border: 1px solid var(--border);
		color: var(--primary);
		cursor: pointer;
	}
	.intro {
		font-size: 0.95rem;
		color: var(--muted-foreground);
		margin: 1rem 0 2rem;
	}
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 280px;
		gap: 1.5rem;
	}
	.sidebar {
		position: sticky;
		top: 1.5rem;
		align-self: start;
	}
	.results {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
		justify-content: space-between;
		margin: 1.5rem 0 1rem;
	}
	h2 {
		font: 700 1.2rem var(--font-heading);
		margin: 0;
		overflow-wrap: anywhere;
	}
	.results p {
		margin: 0.3rem 0 0;
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}
	.views {
		border: 0;
		margin: 0;
		min-inline-size: 0;
		display: flex;
		padding: 0.2rem;
		gap: 0.2rem;
		border-radius: 0.5rem;
		background: var(--border);
	}
	.views button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		border: 0;
		padding: 0.65rem 0.8rem;
		min-height: 2.75rem;
		border-radius: 0.4rem;
		background: transparent;
		color: var(--primary);
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}
	.views button[aria-pressed="true"] {
		background: white;
	}
	.merchants {
		display: grid;
		gap: 1rem;
	}
	.grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.note {
		margin: 2rem 0 0;
		color: var(--muted-foreground);
		font-size: 0.75rem;
		line-height: 1.6;
	}
	.mobile-cart {
		display: none;
	}
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
		.sidebar {
			display: none;
		}
		.mobile-cart {
			position: fixed;
			bottom: 1rem;
			left: 1rem;
			right: 1rem;
			display: flex;
			justify-content: space-between;
			gap: 1rem;
			padding: 1rem;
			background: var(--primary);
			color: white;
			border-radius: 0.6rem;
			box-shadow: 0 3px 15px #0002;
		}
	}
	@media (max-width: 640px) {
		main {
			padding: 1.5rem 1rem 7rem;
		}
		.grid :global(.identity) {
			flex-wrap: wrap;
			gap: 0.5rem;
		}
		.grid :global(.identity .photo) {
			width: 100%;
			height: 7rem;
		}
		.grid :global(.identity > div:nth-child(2)) {
			flex-basis: 65%;
		}
		.grid :global(article) {
			padding: 0.7rem;
			gap: 0.7rem;
		}
		.grid :global(.product) {
			flex-direction: column;
		}
		.grid :global([data-slot="button"]) {
			white-space: normal;
			height: auto;
			min-height: 2.75rem;
			font-size: 0.75rem;
		}
		.results {
			align-items: stretch;
			flex-direction: column;
		}
	}
</style>
