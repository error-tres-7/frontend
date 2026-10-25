<script lang="ts">
	import { ArrowLeft, Check, HandCoins, ShoppingBag } from "@lucide/svelte";
	import { createMutation } from "@tanstack/svelte-query";
	import { SvelteSet } from "svelte/reactivity";
	import { failure_message } from "#lib/merchant/errors.js";
	import { ORDER_LABELS, PAYMENT_LABELS, quantity } from "#lib/merchant/labels.js";
	import { ORDER_STEPS, reached_step } from "#lib/merchant/orders.js";
	import StatusBadge from "#merchants/molecules/status-badge.svelte";
	import { orders } from "#services/merchants/index.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import type { Order } from "#typing/schemas/merchants.js";
	import { mxn } from "#utils/format.js";
	import CancelDialog from "./cancel-dialog.svelte";
	import DeliverDialog from "./deliver-dialog.svelte";

	let {
		order,
		stall,
		back,
		onchange,
	}: {
		order: Order;
		/** "Local 24", shown with the pickup time. */
		stall: string | null;
		/** Narrow screens show the detail alone, with a way back to the list. */
		back?: string;
		onchange: (order: Order) => void;
	} = $props();

	let delivering = $state(false);
	let cancelling = $state(false);
	const packed = new SvelteSet<string>();
	let reached = $derived(reached_step(order.status));
	let all_packed = $derived(order.items.every((item) => packed.has(item.product_id)));

	$effect(() => {
		// A different order starts with an empty checklist.
		order.id;
		packed.clear();
	});

	const step = createMutation(() => ({
		mutationFn: (action: "accept" | "ready") => orders[action]({ body: { id: order.id } }),
		onSuccess: onchange,
	}));
</script>

<article class="card detail" aria-labelledby="pedido-titulo">
	{#if back}
		<a class="back" href={back}><ArrowLeft size={18} aria-hidden="true" />Pedidos</a>
	{/if}
	<header>
		<h2 id="pedido-titulo">Pedido #{order.number} · {order.customer_name}</h2>
		<StatusBadge tone={ORDER_LABELS[order.status].tone}>{ORDER_LABELS[order.status].label}</StatusBadge>
	</header>
	<p class="pickup">Recoge hoy de {order.pickup.from} a {order.pickup.to}{stall ? ` · ${stall}` : ""}</p>

	{#if order.status !== "cancelled"}
		<ol class="steps" aria-label="Avance del pedido">
			{#each ORDER_STEPS as label, index (label)}
				<li data-reached={index <= reached} aria-current={index === reached ? "step" : undefined}>{label}</li>
			{/each}
		</ol>
	{/if}

	{#if order.status === "preparing"}
		<fieldset class="items">
			<legend>Prepara su canasta</legend>
			{#each order.items as item (item.product_id)}
				<label class="item check">
					<input
						type="checkbox"
						checked={packed.has(item.product_id)}
						onchange={(event) =>
							event.currentTarget.checked ? packed.add(item.product_id) : packed.delete(item.product_id)}
					>
					<span class="name">{item.name}<small>{quantity(item.quantity, item.unit)}</small></span>
					<span class="amount">{mxn(item.amount, { decimals: true })}</span>
				</label>
			{/each}
		</fieldset>
	{:else}
		<ul class="items">
			{#each order.items as item (item.product_id)}
				<li class="item">
					<span class="name">{item.name}<small>{quantity(item.quantity, item.unit)}</small></span>
					<span class="amount">{mxn(item.amount, { decimals: true })}</span>
				</li>
			{/each}
		</ul>
	{/if}

	{#if order.note}
		<div class="note">
			<span>Nota de {order.customer_name.split(" ")[0]}</span>
			<p>{order.note}</p>
		</div>
	{/if}

	<p class="total">
		<span
			>{order.status === "delivered"
				? "Total cobrado"
				: order.status === "cancelled"
					? "Total"
					: "Total estimado"}</span
		>
		<strong>{mxn(order.payment?.amount ?? order.total, { decimals: true })}</strong>
	</p>

	<footer>
		{#if order.status === "pending"}
			<h3>¿Tienes todo disponible?</h3>
			<p class="hint">
				Al aceptar, apartamos los productos de tu inventario. Si te falta algo, cancela el pedido para que
				{order.customer_name.split(" ")[0]}
				pueda buscarlo en otro puesto.
			</p>
			<Button class="h-12 w-full" disabled={step.isPending} onclick={() => step.mutate("accept")}>
				<Check aria-hidden="true" />{step.isPending ? "Aceptando…" : "Aceptar pedido"}
			</Button>
		{:else if order.status === "preparing"}
			<Button class="h-12 w-full" disabled={!all_packed || step.isPending} onclick={() => step.mutate("ready")}>
				<ShoppingBag aria-hidden="true" />{step.isPending ? "Guardando…" : "Marcar como listo"}
			</Button>
			<p class="hint center">
				{all_packed
					? `Avisaremos a ${order.customer_name.split(" ")[0]} que puede pasar.`
					: "Marca cada producto al tenerlo listo."}
			</p>
		{:else if order.status === "ready"}
			<Button class="h-12 w-full" onclick={() => (delivering = true)}>
				<HandCoins aria-hidden="true" />Entregar y cobrar
			</Button>
		{:else if order.status === "delivered" && order.payment}
			<p class="hint">
				Entregado y cobrado en {PAYMENT_LABELS[order.payment.method].label.toLocaleLowerCase("es-MX")}. Ya cuenta en tus
				ventas de hoy.
			</p>
		{:else if order.status === "cancelled"}
			<p class="hint">Pedido cancelado. Los productos apartados volvieron a tu inventario.</p>
		{/if}
		{#if step.isError}
			<p class="error" role="alert">{failure_message(step.error, "No se guardó el cambio")} El pedido sigue igual.</p>
		{/if}
		{#if order.status === "pending" || order.status === "preparing" || order.status === "ready"}
			<div class="secondary">
				<button type="button" class="cancel" onclick={() => (cancelling = true)}>No puedo atenderlo</button>
				<span>Aún sin cobrar</span>
			</div>
		{/if}
	</footer>
</article>

{#if order.status === "ready"}
	<DeliverDialog bind:open={delivering} {order} ondelivered={onchange} />
{/if}
<CancelDialog bind:open={cancelling} {order} oncancelled={onchange} />

<style>
	.detail {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.5rem;
		border: 1px solid var(--line);
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 44px;
		width: fit-content;
		color: var(--leaf);
		font-weight: 600;
	}
	header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}
	h2 {
		margin: 0;
		font: 700 1.5rem / 1.15 var(--font-heading);
	}
	.pickup {
		margin: 0;
		color: var(--muted-ink);
		font-size: 0.875rem;
	}
	.steps {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
		margin: 0;
		padding: 0 0 1.25rem;
		border-bottom: 1px solid var(--line);
		list-style: none;
	}
	.steps li {
		padding-top: 0.75rem;
		border-top: 4px solid var(--line);
		color: var(--muted-ink);
		font-size: 0.75rem;
	}
	.steps li[data-reached="true"] {
		border-color: var(--leaf);
		color: var(--ink);
		font-weight: 600;
	}
	.items {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		border: 0;
		list-style: none;
	}
	legend {
		margin-bottom: 0.5rem;
		font: 700 1.25rem var(--font-heading);
	}
	.item {
		display: flex;
		align-items: center;
		gap: 1rem;
		min-height: 56px;
	}
	.check {
		cursor: pointer;
	}
	.check input {
		flex: none;
		width: 24px;
		height: 24px;
		accent-color: var(--leaf);
	}
	.name {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 1rem;
		font-weight: 600;
	}
	.name small {
		color: var(--muted-ink);
		font-size: 0.75rem;
		font-weight: 400;
	}
	.amount {
		margin-left: auto;
		font-weight: 700;
	}
	.note {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border-radius: 8px;
		background: var(--mist);
	}
	.note span {
		color: var(--muted-ink);
		font-size: 0.75rem;
		font-weight: 600;
	}
	.note p {
		margin: 0;
		font-size: 0.875rem;
	}
	.total {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin: 0;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--line);
		font-size: 0.875rem;
	}
	.total strong {
		font-size: 1rem;
	}
	footer {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 700;
	}
	.hint {
		margin: 0;
		color: var(--muted-ink);
		font-size: 0.875rem;
		line-height: 1.5;
	}
	.center {
		text-align: center;
	}
	.error {
		margin: 0;
		color: var(--tomato);
		font-size: 0.875rem;
	}
	.secondary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		color: var(--muted-ink);
		font-size: 0.8125rem;
	}
	.cancel {
		min-height: 44px;
		padding: 0;
		border: 0;
		background: none;
		color: var(--tomato);
		font-size: 0.8125rem;
		font-weight: 700;
		cursor: pointer;
	}
	.cancel:hover {
		text-decoration: underline;
	}
</style>
