<script lang="ts">
	import { createQuery } from "@tanstack/svelte-query";
	import { get_merchant } from "#lib/merchant/context.js";
	import { price_stats, usable_references } from "#lib/merchant/prices.js";
	import { merchant_queries } from "#lib/merchant/queries.js";
	import PageHeader from "#merchants/molecules/page-header.svelte";
	import QueryState from "#merchants/molecules/query-state.svelte";
	import { ProductsSchema } from "#schemas/merchants/products/index.js";
	import { mxn } from "#utils/format.js";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import PriceReview from "./price-review.svelte";

	let { id }: { id: string } = $props();

	const merchant = get_merchant();
	const references = createQuery(() => merchant_queries.references(id));
	let back = $derived(resolve("/(merchants)/negocio/precios/[product]", { product: id }));
</script>

<svelte:head><title>Revisar precio · Tu negocio · entrepuestos</title></svelte:head>

<PageHeader
	title="Tú eliges el nuevo precio."
	subtitle={`${references.data ? `${references.data.product.name} · ` : ""}Propuesta editable · Todavía no se ha guardado`}
	back={{ href: back, label: "Volver a comparar" }}
/>

<QueryState query={references} what="tu producto y sus referencias">
	{#snippet children(data)}
		{@const usable = usable_references(data.references, merchant.today)}
		{@const stats = price_stats(usable.map((reference) => reference.price))}
		{@const requested = ProductsSchema.PriceForm.safeParse({ price: page.url.searchParams.get("precio") ?? "" })}
		<PriceReview
			{data}
			{stats}
			{back}
			names={usable.map((reference) => `${reference.market} ${mxn(reference.price)}`).join(" · ")}
			proposal={(requested.success ? requested.data.price : (stats?.median ?? data.product.price)).toFixed(2)}
		/>
	{/snippet}
</QueryState>
