<script lang="ts">
	import { createMutation } from "@tanstack/svelte-query";
	import { get_merchant } from "#lib/merchant/context.js";
	import { failure_message } from "#lib/merchant/errors.js";
	import { CANCEL_REASONS, OrdersSchema } from "#schemas/merchants/orders/index.js";
	import { orders } from "#services/merchants/index.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import * as Dialog from "#sharing/molecules/dialog/index.js";
	import { createAppForm } from "#sharing/organisms/form/index.js";
	import type { CancelValues, Order } from "#typing/schemas/merchants.js";

	let {
		open = $bindable(false),
		order,
		oncancelled,
	}: { open?: boolean; order: Order; oncancelled: (order: Order) => void } = $props();

	const merchant = get_merchant();

	const cancel = createMutation(() => ({
		mutationFn: (body: CancelValues) => orders.cancel({ body: { ...body, id: order.id } }),
		onSuccess: (updated) => {
			open = false;
			oncancelled(updated);
		},
	}));

	const form = createAppForm(() => ({
		defaultValues: { reason: "" },
		validators: { onSubmit: OrdersSchema.Cancel },
		onSubmit: async ({ value }) => {
			await cancel.mutateAsync(OrdersSchema.Cancel.parse(value)).catch(() => undefined);
		},
	}));
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="merchant-dialog" portalProps={{ to: merchant.portal }}>
		<Dialog.Header>
			<Dialog.Title>¿Cancelar el pedido #{order.number}?</Dialog.Title>
			<Dialog.Description>
				Se liberan los productos apartados y avisaremos a {order.customer_name} con el motivo que elijas.
			</Dialog.Description>
		</Dialog.Header>
		<form
			novalidate
			class="flex flex-col gap-5"
			onsubmit={async (event) => {
				event.preventDefault();
				const element = event.currentTarget;
				await form.handleSubmit();
				if (!form.state.isValid) element.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
			}}
		>
			<form.AppField name="reason">
				{#snippet children(field)}
					<field.Select
						label="Motivo"
						placeholder="Elige un motivo"
						options={CANCEL_REASONS.map((reason) => ({ value: reason, label: reason }))}
					/>
				{/snippet}
			</form.AppField>
			{#if cancel.isError}
				<p class="text-sm text-destructive" role="alert">
					{failure_message(cancel.error, "No se canceló el pedido")}
					El pedido sigue igual.
				</p>
			{/if}
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (open = false)}>Conservar pedido</Button>
				<form.AppForm>
					<form.Submit pending="Cancelando…">Cancelar pedido</form.Submit>
				</form.AppForm>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
