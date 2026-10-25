<script lang="ts">
	import { Plus, SlidersHorizontal } from "@lucide/svelte";
	import { createQuery } from "@tanstack/svelte-query";
	import { onMount } from "svelte";
	import { get_merchant } from "#lib/merchant/context.js";
	import { merchant_queries } from "#lib/merchant/queries.js";
	import PageHeader from "#merchants/molecules/page-header.svelte";
	import QueryState from "#merchants/molecules/query-state.svelte";
	import { Button } from "#sharing/molecules/button/index.js";
	import { current_hour, greeting, long_day } from "#utils/format.js";
	import { resolve } from "$app/paths";
	import MoneySummary from "./overview/money-summary.svelte";
	import PendingTasks from "./overview/pending-tasks.svelte";
	import PriceCard from "./overview/price-card.svelte";
	import TodayOrders from "./overview/today-orders.svelte";
	import WeekChart from "./overview/week-chart.svelte";

	const merchant = get_merchant();
	const overview = createQuery(() => merchant_queries.overview(merchant.today));
	const profile = createQuery(() => merchant_queries.profile());

	// The hour is the visitor's, so the greeting waits for the browser.
	let hour = $state<number | null>(null);
	onMount(() => {
		hour = current_hour();
	});
	let title = $derived(
		`${hour === null ? "Hola" : greeting(hour)}${profile.data ? `, ${profile.data.owner_name}` : ""}.`
	);
</script>

<svelte:head><title>Resumen · Tu negocio · entrepuestos</title></svelte:head>

<PageHeader
	{title}
	subtitle={overview.data ? `Hoy · ${long_day(overview.data.date)} · Importes en MXN` : "Importes en MXN"}
>
	{#snippet actions()}
		<Button class="h-12 w-full sm:w-auto" onclick={merchant.register_sale}
			><Plus aria-hidden="true" />Registrar venta</Button
		>
	{/snippet}
</PageHeader>

<a class="payments-link" href={`${resolve("/(merchants)/negocio/puesto")}#formas-de-pago`}>
	<SlidersHorizontal size={18} aria-hidden="true" />Formas de pago que aceptas →
</a>

<QueryState query={overview} what="tu resumen">
	{#snippet children(data)}
		<MoneySummary totals={data.totals} collected={data.collected} />
		<PriceCard reference={data.price_reference} />
		<div class="split">
			<WeekChart week={data.week} today={data.date} />
			<PendingTasks pending={data.pending_orders} low_stock={data.low_stock} />
		</div>
		<TodayOrders orders={data.orders} />
		<p class="note">
			Los apartados pendientes no cuentan como ventas. Registra el cobro al entregar. Los métodos aceptados se
			configuran en Mi puesto; aquí ves cómo te pagaron.
		</p>
	{/snippet}
</QueryState>

<style>
	.payments-link {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
		width: fit-content;
		min-height: 44px;
		color: var(--leaf);
		font-size: 0.875rem;
		font-weight: 600;
	}
	.payments-link:hover {
		text-decoration: underline;
	}
	.split {
		display: grid;
		gap: 1rem;
	}
	.note {
		margin: 0;
		color: var(--muted-ink);
		font-size: 0.8125rem;
		line-height: 1.5;
	}
	@media (min-width: 1024px) {
		.split {
			grid-template-columns: minmax(0, 1fr) 306px;
			gap: 1.25rem;
		}
	}
</style>
