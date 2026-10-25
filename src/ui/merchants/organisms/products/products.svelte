<script lang="ts">
	import { ImageIcon, Pencil, Plus, Search } from "@lucide/svelte";
	import { createQuery } from "@tanstack/svelte-query";
	import { quantity, UNIT_LABELS } from "#lib/merchant/labels.js";
	import {
		filter_products,
		PRODUCT_FILTERS,
		PRODUCT_STATUS,
		type ProductFilter,
		product_status,
	} from "#lib/merchant/products.js";
	import { merchant_queries } from "#lib/merchant/queries.js";
	import PageHeader from "#merchants/molecules/page-header.svelte";
	import QueryState from "#merchants/molecules/query-state.svelte";
	import StatusBadge from "#merchants/molecules/status-badge.svelte";
	import { Button } from "#sharing/molecules/button/index.js";
	import { Input } from "#sharing/molecules/input/index.js";
	import { mxn } from "#utils/format.js";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import ProductEditor from "./product-editor.svelte";

	const list = createQuery(() => merchant_queries.products());
	let query = $state("");
	let filter = $state<ProductFilter>("all");

	const base = resolve("/(merchants)/negocio/productos");
	const edit = (id: string) => `${base}?producto=${encodeURIComponent(id)}`;
	let requested = $derived(page.url.searchParams.get("producto"));
	let editing = $derived(list.data?.find((product) => product.id === requested));
	let creating = $derived(requested === "nuevo");
	let open = $derived(Boolean(editing) || creating);
	let shown = $derived(filter_products(list.data ?? [], query, filter));
</script>

<svelte:head><title>Productos · Tu negocio · entrepuestos</title></svelte:head>

<div class="products" data-editing={open}>
	<div class="catalog">
		<PageHeader title="Tus productos" subtitle="Lo que publicas aquí aparece en tu puesto digital.">
			{#snippet actions()}
				<Button href={edit("nuevo")} class="h-12"><Plus aria-hidden="true" />Agregar producto</Button>
			{/snippet}
		</PageHeader>

		<div class="filters">
			<div class="search">
				<label class="sr-only" for="buscar-producto">Buscar producto</label>
				<Search size={18} aria-hidden="true" />
				<Input id="buscar-producto" type="search" placeholder="Buscar producto" bind:value={query} class="pl-10" />
			</div>
			<label>
				<span class="sr-only">Filtrar por estado</span>
				<select data-slot="select" bind:value={filter}>
					{#each PRODUCT_FILTERS as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</label>
		</div>

		<QueryState query={list} what="tus productos">
			{#snippet children(all)}
				<section class="card table" aria-label="Productos">
					{#if shown.length}
						<table>
							<thead>
								<tr>
									<th scope="col">Producto</th>
									<th scope="col">Precio</th>
									<th scope="col">Existencias</th>
									<th scope="col"><span class="sr-only">Editar</span></th>
								</tr>
							</thead>
							<tbody>
								{#each shown as product (product.id)}
									{@const status = product_status(product)}
									<tr aria-current={product.id === editing?.id ? "true" : undefined}>
										<th scope="row">
											<span class="product">
												{#if product.image_url}
													<img src={product.image_url} alt="" width="48" height="48">
												{:else}
													<span class="photo" aria-hidden="true"><ImageIcon size={20} /></span>
												{/if}
												<span class="name">
													{product.name}
													<small>{product.category} · por {UNIT_LABELS[product.unit].one}</small>
												</span>
											</span>
											<StatusBadge tone={PRODUCT_STATUS[status].tone}>{PRODUCT_STATUS[status].label}</StatusBadge>
										</th>
										<td class="price">{mxn(product.price, { decimals: true })}</td>
										<td class="stock" data-low={status === "low"}>{quantity(product.stock, product.unit)}</td>
										<td>
											<a class="edit" href={edit(product.id)}>
												<Pencil size={18} aria-hidden="true" /><span class="sr-only">Editar {product.name}</span>
											</a>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{:else if all.length}
						<p class="empty">Ningún producto coincide con la búsqueda o el estado elegido.</p>
					{:else}
						<p class="empty">Aún no tienes productos. Agrega el primero para que aparezca en tu puesto.</p>
					{/if}
					<p class="note">El stock disponible descuenta los pedidos aceptados.</p>
					<p class="note">Los productos agotados siguen visibles con su estado.</p>
				</section>
			{/snippet}
		</QueryState>
	</div>

	{#if open}
		{#key requested}
			<ProductEditor product={editing} close={base} />
		{/key}
	{/if}
</div>

<style>
	.products {
		display: grid;
		gap: 1.25rem;
		align-items: start;
	}
	.catalog {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-width: 0;
	}
	[data-editing="true"] .catalog {
		display: none;
	}
	.filters {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}
	.search {
		position: relative;
		display: flex;
		align-items: center;
	}
	.search :global(svg) {
		position: absolute;
		left: 0.875rem;
		color: var(--muted-ink);
	}
	.table {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1.25rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}
	thead th {
		padding: 0 0.5rem 0.75rem;
		color: var(--ink);
		font-size: 0.75rem;
		font-weight: 600;
		text-align: left;
	}
	tbody tr {
		border-top: 1px solid var(--line);
	}
	tbody tr[aria-current="true"] {
		background: var(--mint);
	}
	tbody th,
	tbody td {
		padding: 0.75rem 0.5rem;
		text-align: left;
		vertical-align: top;
	}
	tbody th {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		font-weight: 400;
	}
	.product {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}
	img,
	.photo {
		flex: none;
		width: 48px;
		height: 48px;
		border-radius: 8px;
		object-fit: cover;
	}
	.photo {
		display: grid;
		place-items: center;
		background: var(--mist);
		color: var(--muted-ink);
	}
	.name {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
		font-weight: 600;
	}
	.name small {
		color: var(--muted-ink);
		font-size: 0.6875rem;
		font-weight: 400;
	}
	.price,
	.stock {
		padding-top: 1.5rem;
		white-space: nowrap;
	}
	.price {
		font-weight: 600;
	}
	.stock[data-low="true"] {
		color: var(--warn);
	}
	.edit {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		margin-top: 0.75rem;
		border-radius: 8px;
	}
	.edit:hover {
		background: var(--mint);
	}
	.empty,
	.note {
		margin: 0;
		color: var(--muted-ink);
		font-size: 0.75rem;
	}
	.empty {
		padding-block: 1rem;
		font-size: 0.875rem;
	}
	@media (min-width: 768px) {
		.filters {
			grid-template-columns: 1fr auto;
		}
	}
	@media (min-width: 1024px) {
		.products {
			grid-template-columns: minmax(0, 1fr) 350px;
		}
		[data-editing="true"] .catalog {
			display: flex;
		}
		.products:not([data-editing="true"]) {
			grid-template-columns: 1fr;
		}
	}
</style>
