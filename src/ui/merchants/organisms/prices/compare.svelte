<script lang="ts">
	import { ArrowRight, Check, Info } from "@lucide/svelte";
	import { createQuery } from "@tanstack/svelte-query";
	import { get_merchant } from "#lib/merchant/context.js";
	import { UNIT_LABELS } from "#lib/merchant/labels.js";
	import { position_in_range, price_stats, usable_references } from "#lib/merchant/prices.js";
	import { merchant_queries } from "#lib/merchant/queries.js";
	import PageHeader from "#merchants/molecules/page-header.svelte";
	import QueryState from "#merchants/molecules/query-state.svelte";
	import { Button } from "#sharing/molecules/button/index.js";
	import { mxn, short_day } from "#utils/format.js";
	import { resolve } from "$app/paths";

	let { id }: { id: string } = $props();

	const merchant = get_merchant();
	const references = createQuery(() => merchant_queries.references(id));
	const profile = createQuery(() => merchant_queries.profile());
	const overview = resolve("/(merchants)/negocio");

	let usable = $derived(usable_references(references.data?.references ?? [], merchant.today));
	let stats = $derived(price_stats(usable.map((reference) => reference.price)));
	let skipped = $derived((references.data?.references.length ?? 0) - usable.length);
</script>

<svelte:head><title>Comparar precios · Tu negocio · entrepuestos</title></svelte:head>

<PageHeader
	title="Compara antes de decidir."
	subtitle={[
		profile.data?.name,
		references.data && `Giro: ${references.data.product.category.toLocaleLowerCase("es-MX")}`,
		"Precios de venta al público",
	]
		.filter(Boolean)
		.join(" · ")}
	back={{ href: overview, label: "Volver al resumen" }}
/>

<QueryState query={references} what="las referencias de precio">
	{#snippet children(data)}
		{@const unit = UNIT_LABELS[data.product.unit].one}
		{#if data.illustrative}
			<p class="warning" role="note">
				<Info size={18} aria-hidden="true" />
				Ejemplo ilustrativo. Todas las fichas y precios son simulados; no son cotizaciones actuales ni una recomendación
				automática.
			</p>
		{/if}

		<section class="product" aria-labelledby="producto">
			<h2 id="producto">{data.product.name}</h2>
			<p>
				{[
					data.product.variety,
					data.product.grade && `Calidad ${data.product.grade.toLocaleLowerCase("es-MX")}`,
					data.product.presentation,
					data.product.channel,
					`MXN por 1 ${unit}`,
				]
					.filter(Boolean)
					.join(" · ")}
			</p>
		</section>

		<section class="card references" aria-label="Referencias de precio">
			<table>
				<thead>
					<tr>
						<th scope="col">Mercado / puesto</th>
						<th scope="col">Precio por 1 {unit}</th>
						<th scope="col">Fuente</th>
						<th scope="col">Fecha</th>
						<th scope="col">Referencia</th>
					</tr>
				</thead>
				<tbody>
					<tr class="own">
						<th scope="row">
							{profile.data?.market_name ? `${profile.data.market_name.replace(/^Mercado\s+/i, "")} · ` : ""}{profile
								.data?.name ?? "Tu puesto"}
						</th>
						<td>{mxn(data.product.price, { decimals: true })} MXN</td>
						<td>Tu catálogo</td>
						<td>{short_day(merchant.today)}</td>
						<td>Precio actual</td>
					</tr>
					{#each usable as reference (reference.id)}
						<tr>
							<th scope="row">{reference.market} · {reference.label}</th>
							<td>{mxn(reference.price, { decimals: true })} MXN</td>
							<td>{reference.source}</td>
							<td>{short_day(reference.as_of)}</td>
							<td>Comparable</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="caption">
				{usable.length}
				{usable.length === 1 ? "referencia" : "referencias"}
				del mismo giro · Misma unidad y presentación{data.illustrative
					? " · Muestra ilustrativa, no representativa del mercado"
					: ""}{skipped ? ` · ${skipped} no se usan: distinta unidad o calidad, o fecha no vigente` : ""}
			</p>
		</section>

		<section class="tint decision" aria-labelledby="decision">
			{#if stats}
				{@const position = position_in_range(data.product.price, stats)}
				<div class="copy">
					<h2 id="decision">Referencia central: {mxn(stats.median, { decimals: true })} / {unit}</h2>
					<p>
						Rango {mxn(stats.min)}–{mxn(stats.max)}
						/ {unit}. Tu precio de {mxn(data.product.price)}
						{position === "within"
							? "está dentro del rango"
							: position === "below"
								? "está por debajo del rango"
								: "está por arriba del rango"}.
					</p>
					<p class="muted">
						Conservar {mxn(data.product.price)} también es una opción. Revisa tus costos y margen antes de cambiar.
					</p>
				</div>
				<div class="actions">
					<Button
						class="h-12"
						href={`${resolve("/(merchants)/negocio/precios/[product]/revisar", { product: id })}?precio=${stats.median.toFixed(2)}`}
					>
						<ArrowRight aria-hidden="true" />Revisar nuevo precio
					</Button>
					<Button class="h-12 bg-card" variant="outline" href={overview}>
						<Check aria-hidden="true" />Conservar {mxn(data.product.price)} / {unit}
					</Button>
				</div>
			{:else}
				<div class="copy">
					<h2 id="decision">No hay referencias comparables vigentes</h2>
					<p class="muted">
						Sin fichas de la misma unidad, calidad y fecha vigente no sugerimos un precio. Tu precio de
						{mxn(data.product.price, { decimals: true })}
						/ {unit} se mantiene.
					</p>
				</div>
				<div class="actions">
					<Button class="h-12" href={overview}
						><Check aria-hidden="true" />Conservar {mxn(data.product.price)} / {unit}</Button
					>
				</div>
			{/if}
		</section>

		<p class="footnote">
			Comparar no modifica tu catálogo. Solo se guardará un cambio cuando tú lo confirmes en la siguiente pantalla.
		</p>
	{/snippet}
</QueryState>

<style>
	.warning {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin: 0;
		padding: 0.875rem 1.125rem;
		border-radius: 8px;
		background: var(--warn-bg);
		color: var(--warn);
		font-size: 0.875rem;
		font-weight: 600;
	}
	.warning :global(svg) {
		flex: none;
		margin-top: 1px;
	}
	.product h2,
	.decision h2 {
		margin: 0;
		font: 700 1.625rem / 1.15 var(--font-heading);
	}
	.product p {
		margin: 0.5rem 0 0;
		color: var(--muted-ink);
		font-size: 0.875rem;
	}
	.references {
		padding: 1.25rem;
		overflow-x: auto;
	}
	table {
		width: 100%;
		min-width: 560px;
		border-collapse: collapse;
		font-size: 0.875rem;
	}
	thead tr {
		background: var(--mist);
	}
	thead th {
		padding: 1rem 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-align: left;
	}
	tbody th,
	tbody td {
		height: 50px;
		padding: 0 0.75rem;
		font-weight: 400;
		text-align: left;
	}
	tbody td:nth-child(2) {
		font-weight: 700;
	}
	.own {
		background: var(--mint);
	}
	.own th,
	.own td {
		font-weight: 700;
	}
	.caption {
		margin: 0.5rem 0 0;
		color: var(--muted-ink);
		font-size: 0.75rem;
	}
	.decision {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1.25rem;
		padding: 1.5rem;
	}
	.copy {
		display: flex;
		flex: 1 1 22rem;
		flex-direction: column;
		gap: 0.5rem;
	}
	.copy p {
		margin: 0;
		font-size: 0.875rem;
	}
	.muted {
		color: var(--muted-ink);
	}
	.actions {
		display: flex;
		flex: 1 1 14rem;
		flex-direction: column;
		gap: 0.625rem;
		max-width: 100%;
	}
	@media (min-width: 768px) {
		.actions {
			flex: 0 0 236px;
		}
	}
	.footnote {
		margin: 0;
		color: var(--muted-ink);
		font-size: 0.8125rem;
	}
</style>
