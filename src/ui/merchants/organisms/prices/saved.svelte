<script lang="ts">
	import { CircleCheck } from "@lucide/svelte";
	import { createQuery } from "@tanstack/svelte-query";
	import { UNIT_LABELS } from "#lib/merchant/labels.js";
	import { merchant_queries } from "#lib/merchant/queries.js";
	import QueryState from "#merchants/molecules/query-state.svelte";
	import { ProductsSchema } from "#schemas/merchants/products/index.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import { mxn } from "#utils/format.js";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";

	let { id }: { id: string } = $props();

	const references = createQuery(() => merchant_queries.references(id));
	let before = $derived(ProductsSchema.PriceForm.safeParse({ price: page.url.searchParams.get("antes") ?? "" }));
</script>

<svelte:head><title>Precio actualizado · Tu negocio · entrepuestos</title></svelte:head>

<QueryState query={references} what="tu producto">
	{#snippet children(data)}
		{@const unit = UNIT_LABELS[data.product.unit].one}
		<section class="saved" aria-labelledby="precio-actualizado">
			<CircleCheck size={48} aria-hidden="true" />
			<h1 id="precio-actualizado" tabindex="-1" {@attach (node) => node.focus()}>Precio actualizado.</h1>
			<p>{data.product.name} ya muestra el nuevo precio para nuevos apartados.</p>
			<div class="card result">
				<span>{data.product.name}</span>
				<strong>{mxn(data.product.price, { decimals: true })} / {unit}</strong>
				{#if before.success}
					<small>Antes: {mxn(before.data.price, { decimals: true })} / {unit} · MXN</small>
				{/if}
			</div>
			<p class="muted">Los apartados ya aceptados conservan su precio.</p>
			<Button class="h-12" href={resolve("/(merchants)/negocio")}>Volver al resumen</Button>
		</section>
	{/snippet}
</QueryState>

<style>
	.saved {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		max-width: 32rem;
		margin: 3rem auto;
		text-align: center;
	}
	.saved > :global(svg) {
		color: var(--leaf);
	}
	h1 {
		margin: 0;
		font: 700 2.25rem var(--font-heading);
		outline: none;
	}
	p {
		margin: 0;
	}
	.result {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		padding: 1.5rem;
	}
	.result span {
		font-weight: 600;
	}
	.result strong {
		font: 700 2rem var(--font-heading);
	}
	small,
	.muted {
		color: var(--muted-ink);
		font-size: 0.875rem;
	}
</style>
