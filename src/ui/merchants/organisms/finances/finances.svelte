<script lang="ts">
	import { Calendar, Download } from "@lucide/svelte";
	import { createMutation, createQuery } from "@tanstack/svelte-query";
	import { get_merchant } from "#lib/merchant/context.js";
	import { failure_message } from "#lib/merchant/errors.js";
	import { PAYMENT_LABELS, PAYMENT_METHODS } from "#lib/merchant/labels.js";
	import { merchant_queries } from "#lib/merchant/queries.js";
	import PageHeader from "#merchants/molecules/page-header.svelte";
	import QueryState from "#merchants/molecules/query-state.svelte";
	import { finances } from "#services/merchants/index.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import { day_month, mxn } from "#utils/format.js";
	import ExpenseForm from "./expense-form.svelte";
	import Movements from "./movements.svelte";

	const merchant = get_merchant();
	const day = createQuery(() => merchant_queries.finances(merchant.today));

	const download = createMutation(() => ({
		mutationFn: () => finances.export({ params: { date: merchant.today } }),
		onSuccess: (csv) => {
			const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
			const link = Object.assign(document.createElement("a"), {
				href: url,
				download: `movimientos-${merchant.today}.csv`,
			});
			link.click();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		},
	}));
</script>

<svelte:head><title>Finanzas · Tu negocio · entrepuestos</title></svelte:head>

<PageHeader title="Tus cuentas, claras." subtitle="Registra lo que entra y sale. Todo en pesos mexicanos.">
	{#snippet actions()}
		<span class="date"><Calendar size={18} aria-hidden="true" />Hoy · {day_month(merchant.today)}</span>
		<Button variant="outline" class="bg-card" disabled={download.isPending} onclick={() => download.mutate()}>
			<Download aria-hidden="true" />{download.isPending ? "Preparando…" : "Descargar registro"}
		</Button>
	{/snippet}
</PageHeader>
{#if download.isError}
	<p class="error" role="alert">{failure_message(download.error, "No pudimos descargar el registro")}</p>
{/if}

<div class="layout">
	<div class="main">
		<QueryState query={day} what="tus cuentas">
			{#snippet children(data)}
				<section class="card figures" aria-label="Resumen del día">
					<dl>
						<div>
							<dt>Entradas por ventas</dt>
							<dd>{mxn(data.totals.sales)}</dd>
							<dd class="context">
								{data.totals.sales_count} {data.totals.sales_count === 1 ? "venta cobrada" : "ventas cobradas"}
							</dd>
						</div>
						<div>
							<dt>Salidas por gastos</dt>
							<dd>{mxn(data.totals.expenses)}</dd>
							<dd class="context">Compras, transporte e insumos</dd>
						</div>
						<div>
							<dt>Balance del día</dt>
							<dd>{mxn(data.totals.balance)}</dd>
							<dd class="context">Entradas menos salidas; no es utilidad</dd>
						</div>
					</dl>
				</section>

				<section class="tint money" aria-labelledby="donde-dinero">
					<h2 id="donde-dinero">¿Dónde está tu dinero?</h2>
					<dl>
						{#each PAYMENT_METHODS as method (method)}
							{#if method !== "card" || data.collected.card > 0}
								<div>
									<dt>
										Ventas {method === "cash" ? "en" : "por"} {PAYMENT_LABELS[method].label.toLocaleLowerCase("es-MX")}
									</dt>
									<dd>{mxn(data.collected[method])}</dd>
								</div>
							{/if}
						{/each}
						<div class="expected">
							<dt>Efectivo esperado en caja</dt>
							<dd>{mxn(data.cash.expected)}</dd>
						</div>
					</dl>
					<p>
						{mxn(data.cash.opening)}
						iniciales + {mxn(data.collected.cash)} cobrados − {mxn(data.cash.cash_expenses)} pagados en efectivo.
					</p>
				</section>

				<Movements movements={data.movements} />
			{/snippet}
		</QueryState>
	</div>
	<ExpenseForm />
</div>

<style>
	.date {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: 44px;
		padding-inline: 1.125rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--card);
		font-size: 0.9375rem;
		font-weight: 600;
	}
	.error {
		margin: 0;
		color: var(--tomato);
		font-size: 0.875rem;
	}
	.layout {
		display: grid;
		gap: 1.5rem;
		align-items: start;
	}
	.main {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		min-width: 0;
	}
	.figures dl {
		display: grid;
		gap: 0.5rem;
		margin: 0;
		padding: 1.25rem 1.375rem;
	}
	.figures dl > div {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding-block: 0.5rem;
	}
	.figures dt {
		color: var(--muted-ink);
		font-size: 0.875rem;
	}
	.figures dd {
		margin: 0;
		font: 700 2.125rem / 1 var(--font-heading);
		letter-spacing: -0.02em;
	}
	.figures dd.context {
		color: var(--muted-ink);
		font: 400 0.75rem var(--font-body);
		letter-spacing: 0;
	}
	.money {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem 1.375rem;
	}
	.money h2 {
		margin: 0;
		font: 700 1.375rem var(--font-heading);
	}
	.money dl {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		margin: 0;
	}
	.money dl > div {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.9375rem;
	}
	.money dd {
		margin: 0;
		font-weight: 700;
	}
	.money .expected {
		padding-top: 0.875rem;
		border-top: 1px solid var(--sage);
	}
	.money p {
		margin: 0;
		color: var(--muted-ink);
		font-size: 0.75rem;
	}
	@media (min-width: 768px) {
		.figures dl {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	@media (min-width: 1024px) {
		.layout {
			grid-template-columns: minmax(0, 1fr) 340px;
		}
	}
</style>
