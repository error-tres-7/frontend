<script lang="ts">
	import { Check } from "@lucide/svelte";
	import { createMutation, useQueryClient } from "@tanstack/svelte-query";
	import { get_merchant } from "#lib/merchant/context.js";
	import { failure_message } from "#lib/merchant/errors.js";
	import { merchant_keys } from "#lib/merchant/keys.js";
	import { PAYMENT_LABELS, PAYMENT_METHODS, type PaymentMethod } from "#lib/merchant/labels.js";
	import PaymentIcon from "#merchants/molecules/payment-icon.svelte";
	import { FinancesSchema } from "#schemas/merchants/finances/index.js";
	import { finances } from "#services/merchants/index.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import * as Dialog from "#sharing/molecules/dialog/index.js";
	import * as Field from "#sharing/molecules/field/index.js";
	import { createAppForm } from "#sharing/organisms/form/index.js";
	import type { SaleInput, SaleValues } from "#typing/schemas/merchants.js";
	import { mxn } from "#utils/format.js";

	let {
		open = $bindable(false),
		today,
		onsaved,
	}: { open?: boolean; today: string; onsaved: (message: string) => void } = $props();

	const merchant = get_merchant();

	const client = useQueryClient();
	/** One key per sale: a retry after a failure resends it so the API records the sale once. */
	let key = crypto.randomUUID();

	const save = createMutation(() => ({
		mutationFn: (body: SaleValues) => finances.sale({ body: { ...body, date: today }, key }),
		onSuccess: (movement) => {
			client.invalidateQueries({ queryKey: merchant_keys.overview(today) });
			client.invalidateQueries({ queryKey: merchant_keys.finances(today) });
			key = crypto.randomUUID();
			form.reset();
			open = false;
			onsaved(`Venta de ${mxn(movement.amount, { decimals: true })} registrada. Caja actualizada.`);
		},
	}));

	const defaults: SaleInput = { amount: "", concept: "", method: "" };
	const form = createAppForm(() => ({
		defaultValues: defaults,
		validators: { onSubmit: FinancesSchema.Sale },
		onSubmit: async ({ value }) => {
			await save.mutateAsync(FinancesSchema.Sale.parse(value)).catch(() => undefined);
		},
	}));

	const methods = PAYMENT_METHODS.map((value) => ({ value, label: PAYMENT_LABELS[value].label }));
</script>

<Dialog.Root
	bind:open
	onOpenChange={(next) => {
		if (!next && !save.isPending) save.reset();
	}}
>
	<Dialog.Content class="merchant-dialog" portalProps={{ to: merchant.portal }}>
		<Dialog.Header>
			<Dialog.Title>Registrar venta</Dialog.Title>
			<Dialog.Description>Anota lo que cobraste en tu puesto. Se suma a las ventas de hoy.</Dialog.Description>
		</Dialog.Header>
		<form
			novalidate
			class="flex flex-col gap-5"
			onsubmit={async (event) => {
				event.preventDefault();
				const element = event.currentTarget;
				await form.handleSubmit();
				if (!form.state.isValid)
					element.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"] input')?.focus();
			}}
		>
			<Field.Group>
				<form.AppField name="amount">
					{#snippet children(field)}
						<field.Input label="Monto cobrado (MXN)" placeholder="$0.00" inputmode="decimal" autocomplete="off" />
					{/snippet}
				</form.AppField>
				<form.AppField name="method">
					{#snippet children(field)}
						<field.Choices legend="¿Cómo te pagaron?" options={methods}>
							{#snippet option(choice: { value: PaymentMethod; label: string })}
								<PaymentIcon method={choice.value} />{choice.label}
							{/snippet}
						</field.Choices>
					{/snippet}
				</form.AppField>
				<form.AppField name="concept">
					{#snippet children(field)}
						<field.Input label="Concepto (opcional)" placeholder="Ej. 2 kg de jitomate" maxlength={80} />
					{/snippet}
				</form.AppField>
			</Field.Group>
			{#if save.isError}
				<p class="text-sm text-destructive" role="alert">
					{failure_message(save.error, "No se guardó la venta")}
					Tus datos siguen aquí y no se duplicará el registro.
				</p>
			{/if}
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (open = false)}>Cancelar</Button>
				<form.AppForm>
					<form.Submit pending="Guardando…">
						<Check aria-hidden="true" />{save.isError ? "Reintentar" : "Guardar venta"}
					</form.Submit>
				</form.AppForm>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
