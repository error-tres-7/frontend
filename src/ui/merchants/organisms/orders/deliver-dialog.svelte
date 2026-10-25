<script lang="ts">
	import { Check } from "@lucide/svelte";
	import { createMutation } from "@tanstack/svelte-query";
	import { get_merchant } from "#lib/merchant/context.js";
	import { failure_message } from "#lib/merchant/errors.js";
	import { PAYMENT_LABELS, PAYMENT_METHODS, type PaymentMethod } from "#lib/merchant/labels.js";
	import { change_due } from "#lib/merchant/orders.js";
	import PaymentIcon from "#merchants/molecules/payment-icon.svelte";
	import { OrdersSchema } from "#schemas/merchants/orders/index.js";
	import { orders } from "#services/merchants/index.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import * as Dialog from "#sharing/molecules/dialog/index.js";
	import * as Field from "#sharing/molecules/field/index.js";
	import { createAppForm } from "#sharing/organisms/form/index.js";
	import type { DeliverInput, DeliverValues, Order } from "#typing/schemas/merchants.js";
	import { mxn } from "#utils/format.js";

	let {
		open = $bindable(false),
		order,
		ondelivered,
	}: { open?: boolean; order: Order; ondelivered: (order: Order) => void } = $props();

	const merchant = get_merchant();

	/** Same key on retry, so the API records a single sale for this hand-over. */
	let key = crypto.randomUUID();
	const schema = $derived(OrdersSchema.Deliver(order.total));

	const deliver = createMutation(() => ({
		mutationFn: (body: DeliverValues) => orders.deliver({ body: { ...body, id: order.id }, key }),
		onSuccess: (updated) => {
			key = crypto.randomUUID();
			open = false;
			ondelivered(updated);
		},
	}));

	const defaults: DeliverInput = { method: "", received: "" };
	const form = createAppForm(() => ({
		defaultValues: defaults,
		validators: { onSubmit: schema },
		onSubmit: async ({ value }) => {
			await deliver.mutateAsync(schema.parse(value)).catch(() => undefined);
		},
	}));

	const methods = PAYMENT_METHODS.map((value) => ({ value, label: PAYMENT_LABELS[value].label }));
	const method = form.useSelector((state) => state.values.method);
	const received = form.useSelector((state) => state.values.received);
	let change = $derived.by(() => {
		const amount = Number(received.current.replace(/[$,\s]/g, ""));
		return Number.isFinite(amount) && amount >= order.total ? change_due(order.total, amount) : null;
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="merchant-dialog" portalProps={{ to: merchant.portal }}>
		<Dialog.Header>
			<Dialog.Title>Entregar y cobrar #{order.number}</Dialog.Title>
			<Dialog.Description>Registra cómo te pagó {order.customer_name} al recoger.</Dialog.Description>
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
			<dl class="flex items-baseline justify-between">
				<dt class="text-sm text-muted-foreground">Total final</dt>
				<dd class="text-3xl font-bold" style:font-family="var(--font-heading)">
					{mxn(order.total, { decimals: true })}
				</dd>
			</dl>
			<Field.Group>
				<form.AppField name="method">
					{#snippet children(field)}
						<field.Choices legend="¿Cómo te pagaron?" options={methods}>
							{#snippet option(choice: { value: PaymentMethod; label: string })}
								<PaymentIcon method={choice.value} />{choice.label}
							{/snippet}
						</field.Choices>
					{/snippet}
				</form.AppField>
				{#if method.current === "cash"}
					<form.AppField name="received">
						{#snippet children(field)}
							<field.Input label="Recibiste en efectivo" placeholder="$0.00" inputmode="decimal" autocomplete="off" />
						{/snippet}
					</form.AppField>
					{#if change !== null}
						<p class="flex justify-between text-sm" aria-live="polite">
							<span>Cambio para {order.customer_name}</span><strong>{mxn(change, { decimals: true })}</strong>
						</p>
					{/if}
				{/if}
			</Field.Group>
			<p class="text-sm text-muted-foreground">Se registra una sola venta y se actualiza caja.</p>
			{#if deliver.isError}
				<p class="text-sm text-destructive" role="alert">
					{failure_message(deliver.error, "No se registró la entrega")}
					Reintentar no duplicará la venta.
				</p>
			{/if}
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (open = false)}>Volver</Button>
				<form.AppForm>
					<form.Submit pending="Registrando…">
						<Check aria-hidden="true" />{deliver.isError ? "Reintentar" : "Registrar entrega y cobro"}
					</form.Submit>
				</form.AppForm>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
