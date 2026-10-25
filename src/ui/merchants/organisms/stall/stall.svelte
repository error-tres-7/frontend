<script lang="ts">
	import { createQuery } from "@tanstack/svelte-query";
	import { merchant_queries } from "#lib/merchant/queries.js";
	import PageHeader from "#merchants/molecules/page-header.svelte";
	import QueryState from "#merchants/molecules/query-state.svelte";
	import StallForm from "./stall-form.svelte";

	const profile = createQuery(() => merchant_queries.profile());
</script>

<svelte:head><title>Mi puesto · Tu negocio · entrepuestos</title></svelte:head>

<PageHeader
	title="Tu puesto, fácil de encontrar."
	subtitle="Tus horarios y productos ayudan a que más vecinos lleguen a ti."
/>

<QueryState query={profile} what="la información de tu puesto">
	{#snippet children(data)}
		{#key data.id}
			<StallForm profile={data} />
		{/key}
	{/snippet}
</QueryState>
