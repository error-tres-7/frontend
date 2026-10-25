<script lang="ts">
	import { Calendar } from "@lucide/svelte";
	import { createQuery, useQueryClient } from "@tanstack/svelte-query";
	import { MediaQuery } from "svelte/reactivity";
	import { get_merchant } from "#lib/merchant/context.js";
	import { merchant_keys } from "#lib/merchant/keys.js";
	import { count_in, ORDER_TABS, type OrderTab, orders_in, tab_of } from "#lib/merchant/orders.js";
	import { merchant_queries } from "#lib/merchant/queries.js";
	import PageHeader from "#merchants/molecules/page-header.svelte";
	import QueryState from "#merchants/molecules/query-state.svelte";
	import type { Order } from "#typing/schemas/merchants.js";
	import { day_month } from "#utils/format.js";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import OrderCard from "./order-card.svelte";
	import OrderDetail from "./order-detail.svelte";

	const merchant = get_merchant();
	const client = useQueryClient();
	const list = createQuery(() => merchant_queries.orders(merchant.today));
	const profile = createQuery(() => merchant_queries.profile());
	const wide = new MediaQuery("min-width: 1024px");

	let chosen = $state<OrderTab | null>(null);
	let requested = $derived(page.url.searchParams.get("pedido"));
	let all = $derived(list.data ?? []);
	let opened = $derived(all.find((order) => order.id === requested));
	// An order opened by link shows its own tab unless the merchant picks another.
	let tab = $derived<OrderTab>(chosen ?? (opened ? tab_of(opened.status) : "pending"));
	let visible = $derived(orders_in(all, tab));
	let selected = $derived(opened && tab_of(opened.status) === tab ? opened : wide.current ? visible[0] : undefined);

	const base = resolve("/(merchants)/negocio/pedidos");
	const href = (order: Order) => `${base}?pedido=${encodeURIComponent(order.id)}`;

	function updated(order: Order) {
		client.setQueryData<Order[]>(merchant_keys.orders(merchant.today), (current) =>
			current?.map((item) => (item.id === order.id ? order : item))
		);
		client.invalidateQueries({ queryKey: merchant_keys.overview(merchant.today) });
		client.invalidateQueries({ queryKey: merchant_keys.products() });
		if (order.status === "delivered") client.invalidateQueries({ queryKey: merchant_keys.finances(merchant.today) });
	}
</script>

<svelte:head><title>Pedidos · Tu negocio · entrepuestos</title></svelte:head>

{#if !(selected && !wide.current)}
	<PageHeader
		title="Cada pedido, bien atendido."
		subtitle="Confirma lo que tienes. Prepara con calma. Cobra al entregar."
	>
		{#snippet actions()}
			<span class="date"><Calendar size={18} aria-hidden="true" />Hoy · {day_month(merchant.today)}</span>
		{/snippet}
	</PageHeader>
{/if}

<QueryState query={list} what="tus pedidos">
	{#snippet children()}
		<div class="board" data-detail={selected ? "true" : "false"}>
			<fieldset class="tabs">
				<legend class="sr-only">Filtrar pedidos</legend>
				{#each ORDER_TABS as option (option.id)}
					{@const count = count_in(all, option.id)}
					<button
						type="button"
						aria-pressed={tab === option.id}
						onclick={() => {
							chosen = option.id;
						}}
					>
						{option.label}{option.id === "history" ? "" : ` · ${count}`}
					</button>
				{/each}
			</fieldset>
			<div class="list">
				{#if visible.length}
					<ul aria-label={ORDER_TABS.find((option) => option.id === tab)?.label}>
						{#each visible as order (order.id)}
							<li><OrderCard {order} href={href(order)} selected={order.id === selected?.id} /></li>
						{/each}
					</ul>
				{:else}
					<p class="empty">No hay pedidos en esta lista por ahora.</p>
				{/if}
			</div>
			{#if selected}
				<OrderDetail
					order={selected}
					stall={profile.data?.stall ? `Local ${profile.data.stall}` : null}
					back={wide.current ? undefined : base}
					onchange={updated}
				/>
			{/if}
		</div>
	{/snippet}
</QueryState>

<style>
	.date {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 44px;
		padding-inline: 1.125rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--card);
		font-size: 0.9375rem;
		font-weight: 600;
	}
	.board {
		display: grid;
		gap: 1.25rem;
		align-items: start;
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.tabs {
		display: flex;
		gap: 0.5rem;
		min-width: 0;
		margin: 0;
		padding: 0 0 0.25rem;
		border: 0;
		overflow-x: auto;
	}
	.board[data-detail="true"] .list,
	.board[data-detail="true"] .tabs {
		display: none;
	}
	.tabs button {
		flex: none;
		min-height: 44px;
		padding-inline: 0.875rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--card);
		color: var(--ink);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
	}
	.tabs button[aria-pressed="true"] {
		border-color: var(--leaf);
		background: var(--leaf);
		color: #fff;
	}
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.empty {
		margin: 0;
		padding: 1.25rem;
		border-radius: 12px;
		background: var(--card);
		color: var(--muted-ink);
	}
	@media (min-width: 1024px) {
		.board {
			grid-template-columns: 316px minmax(0, 1fr);
		}
		.tabs {
			grid-column: 1 / -1;
		}
		.board[data-detail="true"] .list,
		.board[data-detail="true"] .tabs {
			display: flex;
		}
	}
</style>
