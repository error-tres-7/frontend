<script lang="ts">
	import { Clock } from "@lucide/svelte";
	import { ORDER_LABELS } from "#lib/merchant/labels.js";
	import StatusBadge from "#merchants/molecules/status-badge.svelte";
	import type { Order } from "#typing/schemas/merchants.js";
	import { mxn } from "#utils/format.js";

	let { order, href, selected }: { order: Order; href: string; selected: boolean } = $props();
</script>

<a class="order" {href} aria-current={selected ? "true" : undefined}>
	<span class="top">
		<strong class="number">#{order.number}</strong>
		<span class="total">{mxn(order.total, { decimals: true })}</span>
	</span>
	<span class="customer">{order.customer_name}</span>
	<span class="pickup"><Clock size={16} aria-hidden="true" />{order.pickup.from}–{order.pickup.to}</span>
	<StatusBadge tone={ORDER_LABELS[order.status].tone}>{ORDER_LABELS[order.status].label}</StatusBadge>
</a>

<style>
	.order {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--card);
	}
	.order:hover {
		border-color: var(--leaf);
	}
	.order[aria-current="true"] {
		border: 2px solid var(--leaf);
		padding: calc(1.25rem - 1px);
		background: var(--mint);
	}
	.top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}
	.number {
		font: 700 1.375rem var(--font-heading);
	}
	.total {
		font-size: 1.125rem;
		font-weight: 700;
	}
	.customer {
		font-size: 1rem;
		font-weight: 500;
	}
	.pickup {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--muted-ink);
		font-size: 0.8125rem;
	}
</style>
