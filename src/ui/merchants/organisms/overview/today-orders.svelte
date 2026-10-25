<script lang="ts">
	import { ChevronRight } from "@lucide/svelte";
	import { ORDER_LABELS } from "#lib/merchant/labels.js";
	import StatusBadge from "#merchants/molecules/status-badge.svelte";
	import type { Order } from "#typing/schemas/merchants.js";
	import { mxn } from "#utils/format.js";
	import { resolve } from "$app/paths";

	let { orders }: { orders: Order[] } = $props();
	const href = (order: Order) => `${resolve("/(merchants)/negocio/pedidos")}?pedido=${encodeURIComponent(order.id)}`;
</script>

<section class="card queue" aria-labelledby="pedidos-hoy">
	<header>
		<h2 id="pedidos-hoy">Pedidos de hoy</h2>
		<a href={resolve("/(merchants)/negocio/pedidos")}>Ver todos</a>
	</header>
	{#if orders.length}
		<table>
			<thead>
				<tr>
					<th scope="col">Pedido</th>
					<th scope="col">Cliente</th>
					<th scope="col">Recoge</th>
					<th scope="col">Total</th>
					<th scope="col">Estado</th>
					<th scope="col"><span class="sr-only">Abrir</span></th>
				</tr>
			</thead>
			<tbody>
				{#each orders as order (order.id)}
					<tr>
						<th scope="row"><a href={href(order)}>#{order.number}</a></th>
						<td>{order.customer_name}</td>
						<td>{order.pickup.from}–{order.pickup.to}</td>
						<td class="amount">{mxn(order.total, { decimals: true })}</td>
						<td>
							<StatusBadge tone={ORDER_LABELS[order.status].tone} class="state"
								>{ORDER_LABELS[order.status].label}</StatusBadge
							>
						</td>
						<td>
							<a class="open" href={href(order)}>
								<ChevronRight size={16} aria-hidden="true" /><span class="sr-only">Abrir pedido #{order.number}</span>
							</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p class="empty">Aún no hay pedidos para hoy.</p>
	{/if}
</section>

<style>
	.queue {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem 1.25rem;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	h2 {
		margin: 0;
		font: 700 1.3125rem var(--font-heading);
	}
	header a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		color: var(--leaf);
		font-size: 0.875rem;
		font-weight: 700;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}
	thead tr {
		background: var(--mist);
	}
	thead th {
		padding: 0.3125rem 0.5rem;
		color: var(--muted-ink);
		font-size: 0.75rem;
		font-weight: 600;
		text-align: left;
	}
	tbody th,
	tbody td {
		padding: 0.25rem 0.5rem;
		text-align: left;
		height: 42px;
	}
	tbody th a {
		font-weight: 700;
	}
	.amount {
		font-weight: 600;
		white-space: nowrap;
	}
	.open {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
	}
	.empty {
		margin: 0;
		color: var(--muted-ink);
		font-size: 0.875rem;
	}
	/* Narrow screens: each order becomes a two-line row; headers stay for assistive tech. */
	@media (max-width: 767px) {
		thead {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
		}
		tbody tr {
			display: grid;
			grid-template-columns: auto 1fr auto;
			grid-template-areas: "number customer open" "pickup amount open" "state state open";
			gap: 0.25rem 0.75rem;
			padding-block: 0.625rem;
			border-top: 1px solid var(--line);
		}
		tbody th,
		tbody td {
			height: auto;
			padding: 0;
		}
		tbody th {
			grid-area: number;
		}
		tbody td:nth-of-type(1) {
			grid-area: customer;
		}
		tbody td:nth-of-type(2) {
			grid-area: pickup;
			color: var(--muted-ink);
		}
		tbody td:nth-of-type(3) {
			grid-area: amount;
		}
		tbody td:nth-of-type(4) {
			grid-area: state;
		}
		tbody td:nth-of-type(5) {
			grid-area: open;
			align-self: center;
		}
	}
	@media (min-width: 768px) {
		:global(.queue .state) {
			width: 100%;
			max-width: 190px;
		}
	}
</style>
