<script lang="ts">
	import { ArrowRight, Heart } from "@lucide/svelte";
	import Payments from "#home/molecules/payments.svelte";
	import Photo from "#home/molecules/photo.svelte";
	import { featured_product, type Merchant, money } from "#lib/customer/catalog.js";
	import { get_customer } from "#lib/customer/context.js";
	import { Button } from "#sharing/molecules/button/index.js";

	let {
		merchant,
		onopen,
		list = false,
		query = "",
	}: { merchant: Merchant; onopen: () => void; list?: boolean; query?: string } = $props();
	const customer = get_customer();
	let featured = $derived(featured_product(merchant, query));
</script>

<article class={{ list }}>
	<div class="identity">
		<div class="photo"><Photo kind={merchant.image} /></div>
		<div>
			<h3>{merchant.name}</h3>
			<p>{merchant.location}</p>
			<small>Puesto ficticio · Catálogo de ejemplo</small>
		</div>
		<button
			class="favorite"
			type="button"
			aria-label={`${customer.favorites.includes(merchant.id) ? "Quitar" : "Guardar"} ${merchant.name} en favoritos`}
			aria-pressed={customer.favorites.includes(merchant.id)}
			onclick={() => customer.toggle_favorite(merchant.id)}
		>
			<Heart size={20} fill={customer.favorites.includes(merchant.id) ? "currentColor" : "none"} />
		</button>
	</div>
	<Payments methods={merchant.payments} />
	{#if featured}
		<div class="product">
			<span>{featured.name}</span><strong>{money(featured.price)} <small>/ {featured.unit}</small></strong>
		</div>
	{/if}
	<Button variant="secondary" onclick={onopen}>Ver productos <ArrowRight data-icon="inline-end" /></Button>
</article>

<style>
	article {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: 0.8rem;
		background: white;
	}
	.identity {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
	}
	.identity > div:nth-child(2) {
		flex: 1;
		min-width: 0;
	}
	.photo {
		width: 4rem;
		height: 4.5rem;
		border-radius: 0.5rem;
		flex-shrink: 0;
	}
	h3 {
		margin: 0 0 0.3rem;
		font: 700 1rem var(--font-heading);
	}
	p {
		margin: 0 0 0.3rem;
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}
	small {
		font-size: 0.68rem;
		color: var(--muted-foreground);
	}
	.favorite {
		display: grid;
		place-items: center;
		min-width: 2.75rem;
		min-height: 2.75rem;
		color: var(--primary);
		border: 0;
		background: transparent;
		border-radius: 50%;
		cursor: pointer;
	}
	.product {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem;
		padding-top: 0.7rem;
		border-top: 1px solid var(--border);
		font-size: 0.8rem;
	}
	@media (min-width: 760px) {
		.list {
			display: grid;
			grid-template-columns: minmax(250px, 1.6fr) minmax(140px, 1fr);
			align-items: center;
		}
	}
</style>
