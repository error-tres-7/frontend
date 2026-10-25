<script lang="ts">
	import { PAYMENT_LABELS, PAYMENT_METHODS } from "#lib/merchant/labels.js";
	import type { Overview } from "#typing/schemas/merchants.js";
	import { mxn } from "#utils/format.js";

	let { totals, collected }: Pick<Overview, "totals" | "collected"> = $props();
</script>

<section class="card summary" aria-labelledby="dinero-hoy">
	<h2 id="dinero-hoy" class="sr-only">Dinero de hoy</h2>
	<dl class="figures">
		<div>
			<dt>Ventas cobradas</dt>
			<dd>{mxn(totals.sales)}</dd>
			<dd class="context">
				{totals.sales_count} {totals.sales_count === 1 ? "venta registrada" : "ventas registradas"}
			</dd>
		</div>
		<div>
			<dt>Gastos registrados</dt>
			<dd>{mxn(totals.expenses)}</dd>
			<dd class="context">Compras e insumos</dd>
		</div>
		<div>
			<dt>Balance registrado</dt>
			<dd>{mxn(totals.balance)}</dd>
			<dd class="context">Cobros menos gastos; no es utilidad</dd>
		</div>
	</dl>
	<div class="methods">
		<h3>Cobros de hoy</h3>
		<ul>
			{#each PAYMENT_METHODS as method (method)}
				<li><span>{PAYMENT_LABELS[method].label}</span> <span>{mxn(collected[method])}</span></li>
			{/each}
		</ul>
	</div>
</section>

<style>
	.summary {
		overflow: hidden;
	}
	.figures {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		margin: 0;
	}
	.figures > div {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 1rem 1.25rem;
	}
	.figures > div:first-child {
		grid-column: 1 / -1;
	}
	dt {
		color: var(--muted-ink);
		font-size: 0.875rem;
	}
	dd {
		margin: 0;
		font: 700 clamp(1.75rem, 1.4rem + 1vw, 2.125rem) / 1 var(--font-heading);
		letter-spacing: -0.02em;
	}
	dd.context {
		color: var(--muted-ink);
		font: 400 0.75rem / 1.3 var(--font-body);
		letter-spacing: 0;
	}
	.methods {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem 1rem;
		background: var(--card);
		border-top: 1px solid var(--line);
		font-size: 0.875rem;
	}
	h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 700;
	}
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	@media (min-width: 768px) {
		.figures {
			grid-template-columns: repeat(3, 1fr);
		}
		.figures > div:first-child {
			grid-column: auto;
		}
		.methods {
			flex-direction: row;
			align-items: center;
			gap: 1.125rem;
			padding: 0.625rem 1.25rem;
			background: var(--mint);
			border: 0;
			font-size: 0.75rem;
		}
		h3 {
			font-size: 0.75rem;
		}
		ul {
			flex-direction: row;
			gap: 1.125rem;
		}
		li {
			justify-content: flex-start;
			gap: 0.25rem;
		}
	}
</style>
