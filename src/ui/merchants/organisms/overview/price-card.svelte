<script lang="ts">
	import { ArrowRight } from "@lucide/svelte";
	import { UNIT_LABELS } from "#lib/merchant/labels.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import type { PriceHighlight } from "#typing/schemas/merchants.js";
	import { mxn, short_day } from "#utils/format.js";
	import { resolve } from "$app/paths";

	let { reference }: { reference: PriceHighlight | null } = $props();
</script>

<section class="tint price" aria-labelledby="referencia-precios">
	<div class="row">
		<div class="copy">
			<h2 id="referencia-precios">Una referencia para tus precios</h2>
			{#if reference}
				<p>
					{reference.category}
					· {reference.product_name} · Tu precio {mxn(reference.price, { decimals: true })} /
					{UNIT_LABELS[reference.unit].one}
				</p>
			{:else}
				<p>No hay referencias comparables vigentes para tus productos. Tus precios no cambian.</p>
			{/if}
		</div>
		{#if reference}
			<Button
				href={resolve("/(merchants)/negocio/precios/[product]", { product: reference.product_id })}
				class="h-12 shrink-0"
			>
				<ArrowRight aria-hidden="true" />Comparar precios
			</Button>
		{/if}
	</div>
	{#if reference}
		<p class="source">
			{reference.illustrative ? "Ejemplo ilustrativo" : "Referencias del mismo giro"}
			· {mxn(reference.min)}–{mxn(reference.max)}
			MXN/{UNIT_LABELS[reference.unit].one}
			· {reference.markets.join(", ")} · {short_day(reference.as_of)}
		</p>
	{/if}
</section>

<style>
	.price {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 1rem 1.25rem;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem 1.25rem;
	}
	.copy {
		display: flex;
		flex: 1 1 18rem;
		flex-direction: column;
		gap: 0.375rem;
	}
	h2 {
		margin: 0;
		font: 700 1.4375rem / 1.15 var(--font-heading);
	}
	p {
		margin: 0;
		font-size: 0.875rem;
	}
	.source {
		color: var(--muted-ink);
		font-size: 0.75rem;
	}
	@media (max-width: 767px) {
		.row :global([data-slot="button"]) {
			width: 100%;
		}
	}
</style>
