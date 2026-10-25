<script lang="ts">
	import { ArrowRight, ChevronRight, Package, ShoppingBag } from "@lucide/svelte";
	import { quantity } from "#lib/merchant/labels.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import type { Overview } from "#typing/schemas/merchants.js";
	import { resolve } from "$app/paths";

	let { pending, low_stock }: { pending: number; low_stock: Overview["low_stock"] } = $props();
	const orders = resolve("/(merchants)/negocio/pedidos");
	const product = (id: string) => `${resolve("/(merchants)/negocio/productos")}?producto=${encodeURIComponent(id)}`;
</script>

<section class="tint tasks" aria-labelledby="pendientes-hoy">
	<h2 id="pendientes-hoy">Pendientes de hoy</h2>
	{#if pending || low_stock.length}
		<ul>
			{#if pending}
				<li>
					<a href={orders}>
						<ShoppingBag size={20} aria-hidden="true" />
						<span>{pending} {pending === 1 ? "pedido por confirmar" : "pedidos por confirmar"}</span>
						<ChevronRight size={18} class="chevron" aria-hidden="true" />
					</a>
				</li>
			{/if}
			{#each low_stock as item (item.product_id)}
				<li>
					<a href={product(item.product_id)}>
						<Package size={20} aria-hidden="true" />
						<span>{item.name}: {item.stock === 0 ? "agotado" : `quedan ${quantity(item.stock, item.unit)}`}</span>
						<ChevronRight size={18} class="chevron" aria-hidden="true" />
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p>Todo al día. No hay pedidos por confirmar ni productos por surtir.</p>
	{/if}
	{#if pending}
		<Button href={orders} class="review mt-auto w-full"><ArrowRight aria-hidden="true" />Revisar pedidos</Button>
	{/if}
</section>

<style>
	.tasks {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
	}
	h2 {
		margin: 0;
		font: 700 1.25rem var(--font-heading);
	}
	ul {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	a:not([data-slot="button"]) {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		min-height: 44px;
		font-size: 0.875rem;
		font-weight: 700;
	}
	a:not([data-slot="button"]):hover span {
		text-decoration: underline;
	}
	a :global(.chevron) {
		margin-left: auto;
	}
	p {
		margin: 0;
		color: var(--muted-ink);
		font-size: 0.875rem;
	}
	@media (max-width: 767px) {
		.tasks :global(.review) {
			display: none;
		}
	}
</style>
