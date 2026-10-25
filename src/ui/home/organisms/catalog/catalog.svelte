<script lang="ts">
	import CustomerDialog from "#home/molecules/customer-dialog.svelte";
	import DemoNote from "#home/molecules/demo-note.svelte";
	import EmptyState from "#home/molecules/empty-state.svelte";
	import Payments from "#home/molecules/payments.svelte";
	import Photo from "#home/molecules/photo.svelte";
	import Quantity from "#home/molecules/quantity.svelte";
	import Search from "#home/molecules/search.svelte";
	import { type Merchant, money, normalize_search } from "#lib/customer/catalog.js";
	import { get_customer } from "#lib/customer/context.js";
	import { Button } from "#sharing/molecules/button/index.js";

	let { merchant, onreview }: { merchant: Merchant; onreview: () => void } = $props();
	const customer = get_customer();
	let query = $state("");
	let replacement = $state<{ product_id: string; quantity: number } | null>(null);
	let products = $derived(
		merchant.products.filter((product) => normalize_search(product.name).includes(normalize_search(query)))
	);
	function change(product_id: string, quantity: number) {
		if (!customer.set_quantity(merchant.id, product_id, quantity)) replacement = { product_id, quantity };
	}
</script>

<div class="catalog">
	<div class="merchant">
		<div class="photo"><Photo kind={merchant.image} /></div>
		<div>
			<strong>{merchant.name}</strong>
			<p>Mercado Medellín · {merchant.location}</p>
		</div>
	</div>
	<DemoNote />
	<Payments methods={merchant.payments} />
	<Search bind:value={query} label="Buscar en este puesto" placeholder="Busca un producto" />
	<div class="section-title">
		<h3>Todos los productos</h3>
		<small>{products.length} productos</small>
	</div>
	{#if products.length}
		<div class="products">
			{#each products as product (product.id)}
				<article>
					<div class="product-photo"><Photo kind={product.image} /></div>
					<div class="details">
						<h4>{product.name}</h4>
						<p><strong>{money(product.price)}</strong> / {product.unit}</p>
						<Quantity
							value={customer.quantity(merchant.id, product.id)}
							name={product.name}
							step={product.step}
							unit={product.unit}
							onchange={(quantity) => change(product.id, quantity)}
						/>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<EmptyState
			title="No encontramos ese producto"
			description="Prueba con jitomate, aguacate o cilantro, o limpia la búsqueda."
			><Button variant="outline" onclick={() => (query = "")}>Ver todos los productos</Button></EmptyState
		>
	{/if}
	<p class="note">Precios y métodos de pago ilustrativos. No hay disponibilidad en tiempo real ni reserva de stock.</p>
	<footer>
		<div>
			<strong
				>{customer.merchant?.id === merchant.id ? customer.cart_count : 0}
				productos · {money(customer.merchant?.id === merchant.id ? customer.total : 0)}</strong
			><small>Total estimado · El peso final puede cambiar el importe.</small>
		</div>
		<Button disabled={!customer.cart_count || customer.merchant?.id !== merchant.id} onclick={onreview}
			>Revisar apartado</Button
		>
	</footer>
</div>

{#if replacement}
	<CustomerDialog title="¿Cambiar de puesto?" onclose={() => (replacement = null)}>
		<p>
			Tu carrito es de {customer.merchant?.name}. Para elegir productos de {merchant.name}, necesitas reemplazarlo. No
			mezclamos puestos.
		</p>
		<div class="confirmation">
			<Button variant="outline" onclick={() => (replacement = null)}>Conservar mi carrito</Button
			><Button
				onclick={() => {
					if (replacement) customer.set_quantity(merchant.id, replacement.product_id, replacement.quantity, true);
					replacement = null;
				}}
				>Reemplazar carrito</Button
			>
		</div>
	</CustomerDialog>
{/if}

<style>
	.catalog {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.merchant {
		display: flex;
		gap: 0.8rem;
		align-items: center;
	}
	.photo {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 0.5rem;
	}
	.merchant p {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		margin: 0.25rem 0 0;
	}
	.section-title {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		align-items: center;
	}
	h3 {
		margin: 0;
		font-size: 0.95rem;
	}
	small {
		color: var(--muted-foreground);
		font-size: 0.75rem;
	}
	.products {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
	}
	article {
		border: 1px solid var(--border);
		border-radius: 0.6rem;
		overflow: hidden;
	}
	.product-photo {
		height: 9rem;
	}
	.details {
		display: grid;
		gap: 0.6rem;
		padding: 0.7rem;
	}
	h4 {
		margin: 0;
		font-size: 0.85rem;
	}
	.details p {
		margin: 0;
		font-size: 0.8rem;
	}
	.details strong {
		font-size: 1rem;
	}
	.note {
		font-size: 0.72rem;
		color: var(--muted-foreground);
		margin: 0;
		line-height: 1.5;
	}
	footer {
		position: sticky;
		bottom: 0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 1rem;
		margin: 0.5rem -1.5rem -1.5rem;
		background: var(--background);
		border-top: 1px solid var(--border);
	}
	footer > div {
		display: grid;
		gap: 0.25rem;
	}
	.confirmation {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}
	@media (max-width: 640px) {
		.products {
			grid-template-columns: 1fr;
		}
		article {
			display: flex;
			gap: 0.8rem;
			border: 0;
			overflow: visible;
		}
		.product-photo {
			width: 5.5rem;
			height: 5.5rem;
			border-radius: 0.5rem;
			flex-shrink: 0;
		}
		.details {
			flex: 1;
			padding: 0;
			gap: 0.4rem;
			min-width: 0;
		}
		footer {
			margin: 0.5rem -1rem -1rem;
			bottom: 0;
		}
		footer :global(button) {
			width: 100%;
			min-height: 2.75rem;
		}
	}
</style>
