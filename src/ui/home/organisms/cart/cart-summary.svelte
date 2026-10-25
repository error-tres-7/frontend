<script lang="ts">
	import Payments from "#home/molecules/payments.svelte";
	import { money } from "#lib/customer/catalog.js";
	import { get_customer } from "#lib/customer/context.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import { resolve } from "$app/paths";
	import CartLines from "./cart-lines.svelte";

	const customer = get_customer();
</script>

<aside>
	<h2>Tu carrito</h2>
	{#if customer.merchant}
		<strong>{customer.merchant.name}</strong><small>{customer.merchant.location} · Ejemplo</small>
		<Payments methods={customer.merchant.payments} />
		<CartLines />
		<div class="total"><span>Total estimado</span><strong>{money(customer.total)}</strong></div>
		<Button href={resolve("/(customers)/carrito")}>Ver carrito · {customer.cart_count}</Button>
	{:else}
		<p>Elige productos de un puesto para comenzar.</p>
	{/if}
	<p class="note">Demostración · no envía pedidos. No reserva productos ni realiza cobros.</p>
</aside>

<style>
	aside {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		padding: 1.2rem;
		border: 1px solid var(--border);
		border-radius: 0.8rem;
		background: white;
	}
	h2 {
		font: 700 1.25rem var(--font-heading);
		margin: 0;
	}
	small,
	p {
		color: var(--muted-foreground);
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.5;
	}
	.total {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: 0.85rem;
	}
	.total strong {
		font-size: 1.2rem;
	}
	.note {
		font-size: 0.72rem;
	}
</style>
