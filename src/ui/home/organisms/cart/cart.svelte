<script lang="ts">
	import { ArrowLeft, Store } from "@lucide/svelte";
	import DemoNote from "#home/molecules/demo-note.svelte";
	import EmptyState from "#home/molecules/empty-state.svelte";
	import Payments from "#home/molecules/payments.svelte";
	import Journey from "#home/organisms/catalog/journey.svelte";
	import { type Merchant, money } from "#lib/customer/catalog.js";
	import { get_customer } from "#lib/customer/context.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import { resolve } from "$app/paths";
	import CartLines from "./cart-lines.svelte";

	const customer = get_customer();
	let reviewing_merchant = $state<Merchant | null>(null);
</script>

<svelte:head><title>Tu carrito · entrepuestos</title></svelte:head>
<main>
	<a class="back" href={resolve("/(customers)/mercados/[id]", { id: "medellin" })}
		><ArrowLeft size={16} />
		Volver al mercado</a
	>
	<h1>Tu carrito</h1>
	<DemoNote />
	{#if customer.storage_unavailable}
		<p role="status" class="note">
			Tu navegador no permite guardar cambios. Puedes continuar; el carrito y los favoritos durarán solo esta visita.
		</p>
	{/if}
	{#if customer.merchant && customer.cart_count}
		<p class="intro">Mercado Medellín · {customer.cart_count} productos</p>
		<div class="merchant">
			<Store size={22} />
			<div><strong>{customer.merchant.name}</strong><small>{customer.merchant.location} · Puesto ficticio</small></div>
		</div>
		<p class="label">Métodos de pago ilustrativos</p>
		<Payments methods={customer.merchant.payments} />
		<CartLines editable />
		<div class="total"><span>Total estimado</span><strong>{money(customer.total)}</strong></div>
		<p class="note">
			El total puede variar según el peso. Esta demostración no aparta productos, no envía solicitudes y no realiza
			pagos.
		</p>
		<Button onclick={() => (reviewing_merchant = customer.merchant ?? null)}>Revisar apartado</Button>
		<Button variant="outline" href={resolve("/(customers)/mercados/[id]", { id: "medellin" })}
			>Seguir buscando productos</Button
		>
	{:else}
		<div class="empty">
			<EmptyState
				title="Tu carrito está vacío"
				description="Elige productos de un puesto del catálogo de ejemplo. Puedes cambiar cantidades antes de simular una solicitud."
				><Button href={resolve("/(customers)/mercados/[id]", { id: "medellin" })}
					>Explorar catálogo de ejemplo</Button
				></EmptyState
			>
		</div>
	{/if}
</main>
{#if reviewing_merchant}
	<Journey merchant={reviewing_merchant} review onclose={() => (reviewing_merchant = null)} />
{/if}

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 680px;
		margin: auto;
		padding: 2rem 1.5rem 4rem;
		color: var(--foreground);
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--primary);
		font-size: 0.8rem;
	}
	h1 {
		margin: 0.5rem 0 0;
		font: 750 2rem var(--font-heading);
		letter-spacing: -0.04em;
	}
	.intro {
		margin: 0;
		color: var(--muted-foreground);
		font-size: 0.8rem;
	}
	.merchant {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 1rem;
		border-radius: 0.6rem;
		background: color-mix(in srgb, var(--primary) 7%, white);
	}
	.merchant > div {
		display: grid;
		gap: 0.3rem;
	}
	small {
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}
	.label {
		margin: 0.5rem 0 -0.5rem;
		font-size: 0.8rem;
	}
	.total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
		padding-top: 0.5rem;
	}
	.total strong {
		font-size: 1.6rem;
	}
	.note {
		font-size: 0.75rem;
		line-height: 1.6;
		color: var(--muted-foreground);
		margin: 0;
	}
	.empty {
		margin-top: 1rem;
	}
	main > :global([data-slot="button"]) {
		min-height: 2.75rem;
	}
</style>
