<script lang="ts">
	import { ArrowLeft, Check } from "@lucide/svelte";
	import { createMutation, useQueryClient } from "@tanstack/svelte-query";
	import { untrack } from "svelte";
	import { get_merchant } from "#lib/merchant/context.js";
	import { failure_message } from "#lib/merchant/errors.js";
	import { merchant_keys } from "#lib/merchant/keys.js";
	import { UNIT_LABELS, UNITS } from "#lib/merchant/labels.js";
	import { product_draft } from "#lib/merchant/products.js";
	import StatusBadge from "#merchants/molecules/status-badge.svelte";
	import { ProductsSchema } from "#schemas/merchants/products/index.js";
	import { products } from "#services/merchants/index.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import * as Field from "#sharing/molecules/field/index.js";
	import { createAppForm } from "#sharing/organisms/form/index.js";
	import type { Product, ProductValues } from "#typing/schemas/merchants.js";

	let { product, close }: { product?: Product; close: string } = $props();

	const merchant = get_merchant();
	const client = useQueryClient();
	/** A new product is created once even if the merchant retries. */
	let key = crypto.randomUUID();
	let saved = $state(false);
	// The editor is keyed by product, so its draft starts from the product it opened with.
	const initial = untrack(() => product_draft(product));

	const save = createMutation(() => ({
		mutationFn: (body: ProductValues) =>
			product ? products.update({ body: { ...body, id: product.id } }) : products.create({ body, key }),
		onSuccess: (result) => {
			client.setQueryData<Product[]>(merchant_keys.products(), (current) =>
				current?.some((item) => item.id === result.id)
					? current.map((item) => (item.id === result.id ? result : item))
					: [...(current ?? []), result]
			);
			client.invalidateQueries({ queryKey: merchant_keys.overview(merchant.today) });
			key = crypto.randomUUID();
			saved = true;
			form.reset(product_draft(result));
		},
	}));

	const form = createAppForm(() => ({
		defaultValues: initial,
		validators: { onSubmit: ProductsSchema.ProductForm },
		onSubmit: async ({ value }) => {
			saved = false;
			await save.mutateAsync(ProductsSchema.ProductForm.parse(value)).catch(() => undefined);
		},
	}));

	const unit = form.useSelector((state) => state.values.unit as (typeof UNITS)[number]);
	const price = form.useSelector((state) => state.values.price);
	let suffix = $derived(UNIT_LABELS[unit.current]?.many ?? "");
	let repriced = $derived(
		product !== undefined && product.reserved > 0 && Number(price.current.replace(/[$,\s]/g, "")) !== product.price
	);
</script>

<section class="card editor" aria-labelledby="editor-titulo">
	<a class="back" href={close}><ArrowLeft size={18} aria-hidden="true" />Productos</a>
	<header>
		<h2 id="editor-titulo">
			{product ? `Editar ${product.name.split(" ")[0].toLocaleLowerCase("es-MX")}` : "Nuevo producto"}
		</h2>
		{#if product}
			<StatusBadge tone={product.visible ? "ok" : "muted"}>
				{product.visible ? "Publicado en tu puesto" : "Oculto para clientes"}
			</StatusBadge>
		{/if}
	</header>
	<form
		novalidate
		onsubmit={async (event) => {
			event.preventDefault();
			const element = event.currentTarget;
			await form.handleSubmit();
			if (!form.state.isValid) element.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
		}}
	>
		<Field.Group class="gap-4">
			<form.AppField name="name">
				{#snippet children(field)}
					<field.Input label="Nombre del producto" maxlength={60} autocomplete="off" />
				{/snippet}
			</form.AppField>
			<div class="pair">
				<form.AppField name="price">
					{#snippet children(field)}
						<field.Input label="Precio (MXN)" inputmode="decimal" placeholder="$0.00" autocomplete="off" />
					{/snippet}
				</form.AppField>
				<form.AppField name="unit">
					{#snippet children(field)}
						<field.Select
							label="Se vende por"
							options={UNITS.map((value) => ({ value, label: UNIT_LABELS[value].name }))}
						/>
					{/snippet}
				</form.AppField>
			</div>
			<form.AppField name="stock">
				{#snippet children(field)}
					<field.Input
						label={`Stock disponible (${suffix})`}
						inputmode="decimal"
						autocomplete="off"
						description={product?.reserved ? `Ya descuenta lo apartado en pedidos aceptados.` : undefined}
					/>
				{/snippet}
			</form.AppField>
			<form.AppField name="low_stock_at">
				{#snippet children(field)}
					<field.Input label={`Avisarme cuando queden (${suffix})`} inputmode="decimal" autocomplete="off" />
				{/snippet}
			</form.AppField>
			<form.AppField name="category">
				{#snippet children(field)}
					<field.Input label="Categoría" placeholder="Ej. Verduras" maxlength={40} autocomplete="off" />
				{/snippet}
			</form.AppField>
			<form.AppField name="visible">
				{#snippet children(field)}
					<field.Switch label="Visible para clientes" />
				{/snippet}
			</form.AppField>
		</Field.Group>
		<p class="hint">Precio y stock usan la misma unidad de venta.</p>
		{#if repriced}
			<p class="hint" role="note">Los apartados ya aceptados conservan su precio; el nuevo aplica a nuevos pedidos.</p>
		{/if}
		{#if save.isError}
			<p class="error" role="alert">
				{failure_message(save.error, "No se guardaron los cambios")}
				Tus datos siguen aquí.
			</p>
		{/if}
		{#if saved && !save.isError}
			<p class="saved" role="status"><Check size={16} aria-hidden="true" />Cambios guardados</p>
		{/if}
		<div class="actions">
			<form.AppForm>
				<form.Submit pending="Guardando…">
					<Check aria-hidden="true" />{save.isError ? "Reintentar" : product ? "Guardar cambios" : "Agregar producto"}
				</form.Submit>
			</form.AppForm>
			<Button variant="outline" href={close}>Cancelar</Button>
		</div>
	</form>
</section>

<style>
	.editor {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		border: 1px solid var(--line);
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		width: fit-content;
		min-height: 44px;
		color: var(--leaf);
		font-weight: 600;
	}
	header {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	h2 {
		margin: 0;
		font: 700 1.5rem var(--font-heading);
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.hint,
	.error,
	.saved {
		margin: 0;
		color: var(--muted-ink);
		font-size: 0.75rem;
	}
	.error {
		color: var(--tomato);
		font-size: 0.875rem;
	}
	.saved {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		width: fit-content;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		background: var(--mint);
		color: var(--leaf);
		font-size: 0.875rem;
		font-weight: 600;
	}
	.actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.actions :global([data-slot="button"]) {
		width: 100%;
		height: 48px;
	}
	@media (min-width: 1024px) {
		.back {
			display: none;
		}
	}
</style>
