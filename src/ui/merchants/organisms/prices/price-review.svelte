<script lang="ts">
	import { Check, Info, X } from "@lucide/svelte";
	import { createMutation, useQueryClient } from "@tanstack/svelte-query";
	import { get_merchant } from "#lib/merchant/context.js";
	import { failure_message } from "#lib/merchant/errors.js";
	import { merchant_keys } from "#lib/merchant/keys.js";
	import { UNIT_LABELS } from "#lib/merchant/labels.js";
	import { type PriceStats, price_change } from "#lib/merchant/prices.js";
	import { ProductsSchema } from "#schemas/merchants/products/index.js";
	import { products } from "#services/merchants/index.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import { createAppForm } from "#sharing/organisms/form/index.js";
	import type { Product, References } from "#typing/schemas/merchants.js";
	import { mxn, percent, short_day } from "#utils/format.js";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";

	let {
		data,
		stats,
		names,
		proposal,
		back,
	}: {
		data: References;
		stats: PriceStats | null;
		/** "Jamaica $28 · Portales $30 · Coyoacán $34". */
		names: string;
		/** Starting value of the editable price, as text. */
		proposal: string;
		back: string;
	} = $props();

	const merchant = get_merchant();
	const client = useQueryClient();
	let product = $derived(data.product);
	let unit = $derived(UNIT_LABELS[product.unit]);

	const save = createMutation(() => ({
		mutationFn: (price: number) => products.update({ body: { id: product.id, price } }),
		onSuccess: async (updated) => {
			// Read before the caches change: `product` derives from the cached references.
			const saved = `${resolve("/(merchants)/negocio/precios/[product]/guardado", { product: product.id })}?antes=${product.price.toFixed(2)}`;
			client.setQueryData<Product[]>(merchant_keys.products(), (current) =>
				current?.map((item) => (item.id === updated.id ? updated : item))
			);
			client.setQueryData<References>(merchant_keys.references(product.id), (current) =>
				current ? { ...current, product: { ...current.product, price: updated.price } } : current
			);
			client.invalidateQueries({ queryKey: merchant_keys.overview(merchant.today) });
			await goto(saved);
		},
	}));

	const form = createAppForm(() => ({
		defaultValues: { price: proposal },
		validators: { onSubmit: ProductsSchema.PriceForm },
		onSubmit: async ({ value }) => {
			const { price } = ProductsSchema.PriceForm.parse(value);
			await save.mutateAsync(price).catch(() => undefined);
		},
	}));

	const typed = form.useSelector((state) => state.values.price);
	let parsed = $derived(ProductsSchema.PriceForm.safeParse({ price: typed.current }));
	let next = $derived(parsed.success ? parsed.data.price : null);
	let change = $derived(next === null ? null : price_change(product.price, next));
</script>

<form
	novalidate
	class="review"
	onsubmit={async (event) => {
		event.preventDefault();
		const element = event.currentTarget;
		await form.handleSubmit();
		if (!form.state.isValid) element.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
	}}
>
	<div class="layout">
		<section class="card proposal" aria-labelledby="producto">
			<h2 id="producto">{product.name}</h2>
			<p class="spec">
				{[product.variety, product.grade, product.channel].filter(Boolean).join(" · ")}<br>Unidad de venta: 1
				{unit.name.toLocaleLowerCase("es-MX")}
			</p>
			<div class="prices">
				<div class="current">
					<span>Tu precio actual</span>
					<strong>{mxn(product.price, { decimals: true })} / {unit.one}</strong>
				</div>
				<form.AppField name="price">
					{#snippet children(field)}
						<field.Input
							label={`Nuevo precio · MXN por ${unit.one}`}
							inputmode="decimal"
							autocomplete="off"
							description="Puedes escribir otro importe."
							class="proposal-input"
						/>
					{/snippet}
				</form.AppField>
			</div>
			<p class="change" aria-live="polite">
				{#if change && change.direction !== "same"}
					{change.direction === "down" ? "Baja" : "Sube"}
					{mxn(Math.abs(change.difference), { decimals: true })}
					por {unit.one} ({percent(change.ratio)}) respecto a tu precio actual.
				{:else if change}
					Es igual a tu precio actual; no hay nada que guardar.
				{:else}
					Escribe un precio mayor a $0 con máximo dos decimales.
				{/if}
			</p>
			<p>Al guardar, el precio se usará para nuevos apartados. Los apartados ya aceptados conservan su precio.</p>
			<p class="caution">
				<Info size={18} aria-hidden="true" />Revisa tus costos antes de guardar. No contamos con tus costos por
				{unit.one}
				para calcular tu margen.
			</p>
		</section>

		<aside class="side" aria-label="Vista previa y referencias">
			<div class="tint preview">
				<h2>Así se verá en tu puesto</h2>
				<span class="name">{product.name}</span>
				<strong>{next === null ? "—" : `${mxn(next, { decimals: true })} / ${unit.one}`}</strong>
				<small>Vista previa · Aún sin cambios</small>
			</div>
			{#if stats}
				<p class="sources">
					{data.illustrative ? "Referencia ilustrativa" : "Referencia"}: mediana {mxn(stats.median)}/{unit.one}
					de
					{stats.count}
					{stats.count === 1 ? "ficha" : "fichas"}{data.illustrative ? " simuladas" : ""}. Rango {mxn(stats.min)}–{mxn(
						stats.max
					)}/{unit.one}.
				</p>
				<p class="sources">
					{names}<br>Fuente: {data.references[0]?.source.toLocaleLowerCase("es-MX")} ·
					{short_day(data.references[0]?.as_of ?? merchant.today)}
				</p>
			{:else}
				<p class="sources">No hay referencias comparables vigentes. El precio que elijas es tu decisión.</p>
			{/if}
		</aside>
	</div>

	{#if save.isError}
		<p class="error" role="alert">
			{failure_message(save.error, "No pudimos guardar el precio")}
			Tu precio anterior sigue vigente.
		</p>
	{/if}
	<div class="actions">
		<form.AppForm>
			<form.Submit pending="Guardando…" disabled={change?.direction === "same"}>
				<Check aria-hidden="true" />
				{save.isError
					? "Reintentar"
					: next === null
						? "Guardar"
						: `Guardar ${mxn(next, { decimals: true })} / ${unit.one}`}
			</form.Submit>
		</form.AppForm>
		<Button variant="outline" class="bg-card" href={back}><X aria-hidden="true" />Cancelar</Button>
	</div>
	<p class="footnote">
		Solo el botón Guardar cambia el precio. Cancelar o volver conserva {mxn(product.price, { decimals: true })} /
		{unit.one}.
	</p>
</form>

<style>
	.review {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.layout {
		display: grid;
		gap: 1.5rem;
		align-items: start;
	}
	.proposal {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.75rem;
	}
	h2 {
		margin: 0;
		font: 700 1.625rem var(--font-heading);
	}
	p {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.5;
	}
	.spec {
		color: var(--muted-ink);
	}
	.prices {
		display: grid;
		gap: 1.25rem;
	}
	.current {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		color: var(--muted-ink);
		font-size: 0.875rem;
	}
	.current strong,
	.preview strong {
		color: var(--ink);
		font: 700 1.75rem var(--font-heading);
	}
	.proposal :global([data-slot="input"].proposal-input) {
		height: 56px;
		border: 2px solid var(--leaf);
		font-size: 1.5rem;
		font-weight: 600;
	}
	.change {
		padding: 0.875rem 1rem;
		border-radius: 8px;
		background: var(--mint);
		font-size: 0.875rem;
		font-weight: 600;
	}
	.caution {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		color: var(--muted-ink);
		font-size: 0.875rem;
	}
	.caution :global(svg) {
		flex: none;
		color: var(--tomato);
	}
	.side {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.preview {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.5rem;
	}
	.preview h2 {
		font-size: 1.1875rem;
	}
	.name {
		font-weight: 600;
	}
	.preview small,
	.sources {
		color: var(--muted-ink);
		font-size: 0.75rem;
	}
	.sources {
		font-size: 0.875rem;
	}
	.error {
		color: var(--tomato);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}
	.actions :global([data-slot="button"]) {
		height: 52px;
	}
	.actions :global([type="submit"]) {
		flex: 1 1 15rem;
		max-width: 270px;
	}
	.footnote {
		color: var(--muted-ink);
		font-size: 0.8125rem;
	}
	@media (min-width: 768px) {
		.prices {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (min-width: 1100px) {
		.layout {
			grid-template-columns: minmax(0, 1fr) 340px;
		}
	}
	@media (max-width: 767px) {
		.actions :global([data-slot="button"]) {
			flex: 1 1 100%;
			max-width: none;
		}
	}
</style>
