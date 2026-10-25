<script lang="ts">
	import { Calendar, Check } from "@lucide/svelte";
	import { createMutation, useQueryClient } from "@tanstack/svelte-query";
	import { get_merchant } from "#lib/merchant/context.js";
	import { failure_message } from "#lib/merchant/errors.js";
	import { merchant_keys } from "#lib/merchant/keys.js";
	import { EXPENSE_CATEGORIES, PAYMENT_LABELS, PAYMENT_METHODS } from "#lib/merchant/labels.js";
	import { FinancesSchema } from "#schemas/merchants/finances/index.js";
	import { finances } from "#services/merchants/index.js";
	import * as Field from "#sharing/molecules/field/index.js";
	import { createAppForm } from "#sharing/organisms/form/index.js";
	import type { ExpenseInput, ExpenseValues } from "#typing/schemas/merchants.js";
	import { mxn } from "#utils/format.js";

	const merchant = get_merchant();
	const client = useQueryClient();
	const schema = FinancesSchema.Expense(merchant.today);
	/** One key per expense: a retry after a failure never records it twice. */
	let key = crypto.randomUUID();
	let saved = $state("");

	const save = createMutation(() => ({
		mutationFn: (body: ExpenseValues) => finances.expense({ body, key }),
		onSuccess: (movement, body) => {
			client.invalidateQueries({ queryKey: merchant_keys.finances(body.date) });
			client.invalidateQueries({ queryKey: merchant_keys.overview(body.date) });
			key = crypto.randomUUID();
			saved = `Gasto de ${mxn(movement.amount, { decimals: true })} guardado.`;
			form.reset();
		},
	}));

	const defaults: ExpenseInput = { amount: "", concept: "", category: "", method: "cash", date: merchant.today };
	const form = createAppForm(() => ({
		defaultValues: defaults,
		validators: { onSubmit: schema },
		onSubmit: async ({ value }) => {
			saved = "";
			await save.mutateAsync(schema.parse(value)).catch(() => undefined);
		},
	}));
</script>

<section class="card expense" aria-labelledby="registrar-gasto">
	<h2 id="registrar-gasto">Registrar un gasto</h2>
	<p class="lead">Anótalo ahora para no olvidarlo.</p>
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
			<form.AppField name="amount">
				{#snippet children(field)}
					<field.Input label="Monto (MXN)" placeholder="$0.00" inputmode="decimal" autocomplete="off" />
				{/snippet}
			</form.AppField>
			<form.AppField name="concept">
				{#snippet children(field)}
					<field.Input label="Concepto" placeholder="¿En qué lo gastaste?" maxlength={80} autocomplete="off" />
				{/snippet}
			</form.AppField>
			<form.AppField name="category">
				{#snippet children(field)}
					<field.Select
						label="Categoría"
						placeholder="Elige una categoría"
						options={EXPENSE_CATEGORIES.map((category) => ({ value: category, label: category }))}
					/>
				{/snippet}
			</form.AppField>
			<form.AppField name="method">
				{#snippet children(field)}
					<field.Select
						label="Pagaste con"
						options={PAYMENT_METHODS.map((method) => ({ value: method, label: PAYMENT_LABELS[method].label }))}
					/>
				{/snippet}
			</form.AppField>
			<form.AppField name="date">
				{#snippet children(field)}
					<field.DateTime label="Fecha" type="date" max={merchant.today}>
						{#snippet icon()}
							<Calendar size={18} />
						{/snippet}
					</field.DateTime>
				{/snippet}
			</form.AppField>
		</Field.Group>
		{#if save.isError}
			<p class="error" role="alert">
				{failure_message(save.error, "No se guardó el gasto")}
				Tus datos siguen aquí; no se duplicará el registro.
			</p>
		{/if}
		{#if saved}
			<p class="saved" role="status"><Check size={16} aria-hidden="true" />{saved}</p>
		{/if}
		<form.AppForm>
			<form.Submit pending="Guardando…">
				<Check aria-hidden="true" />{save.isError ? "Reintentar" : "Guardar gasto"}
			</form.Submit>
		</form.AppForm>
		<p class="hint">Se agregará a las salidas de la fecha elegida.</p>
	</form>
</section>

<style>
	.expense {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.5rem;
		border: 1px solid var(--line);
	}
	h2 {
		margin: 0;
		font: 700 1.5rem var(--font-heading);
	}
	.lead,
	.hint {
		margin: 0;
		color: var(--muted-ink);
		font-size: 0.875rem;
	}
	.hint {
		font-size: 0.75rem;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	form :global([data-slot="button"][type="submit"]) {
		width: 100%;
		height: 48px;
	}
	.error {
		margin: 0;
		color: var(--tomato);
		font-size: 0.875rem;
	}
	.saved {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		background: var(--mint);
		color: var(--leaf);
		font-size: 0.875rem;
		font-weight: 600;
	}
</style>
