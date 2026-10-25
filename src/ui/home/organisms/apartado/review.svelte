<script lang="ts">
	import DemoNote from "#home/molecules/demo-note.svelte";
	import Payments from "#home/molecules/payments.svelte";
	import CartLines from "#home/organisms/cart/cart-lines.svelte";
	import { money, pickup_options, validate_contact, validate_name } from "#lib/customer/catalog.js";
	import { get_customer } from "#lib/customer/context.js";
	import { Button } from "#sharing/molecules/button/index.js";
	import * as Field from "#sharing/molecules/field/index.js";
	import { createAppForm } from "#sharing/organisms/form/index.js";

	let { onback, onsubmit }: { onback: () => void; onsubmit: (pickup: string) => void } = $props();
	const customer = get_customer();
	const pickup_id = $props.id();
	let error = $state("");
	const form = createAppForm(() => ({
		defaultValues: { name: "", contact: "", pickup: pickup_options[0] },
		onSubmit: ({ value }) => {
			if (!customer.cart_count) {
				error = "Tu carrito está vacío. Vuelve al catálogo y elige un producto.";
				return;
			}
			if (!pickup_options.includes(value.pickup)) {
				error = "Elige una franja de recogida del ejemplo.";
				return;
			}
			error = "";
			onsubmit(value.pickup);
			form.reset();
		},
	}));
</script>

<form
	novalidate
	onsubmit={async (event) => {
		event.preventDefault();
		const element = event.currentTarget;
		await form.handleSubmit();
		if (!form.state.isValid) element.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
	}}
>
	<DemoNote />
	<div class="review-grid">
		<section aria-label="Resumen de productos">
			<h3>{customer.merchant?.name}</h3>
			<p>Mercado Medellín · {customer.merchant?.location}</p>
			<CartLines />
		</section>
		<Field.Group>
			<form.AppField
				name="pickup"
				validators={{
					onChange: ({ value }) => (pickup_options.includes(value) ? undefined : "Elige una franja del ejemplo."),
				}}
			>
				{#snippet children(field)}
					<Field.Field
						><Field.Label for={pickup_id}>¿Cuándo recogerías?</Field.Label
						><select
							id={pickup_id}
							name={field.name}
							value={field.state.value}
							onblur={() => field.handleBlur()}
							onchange={(event) => field.handleChange(event.currentTarget.value)}
						>
							{#each pickup_options as option (option)}
								<option value={option}>{option}</option>
							{/each}
						</select><Field.Description
							>Horario ilustrativo; no confirma atención ni disponibilidad.</Field.Description
						></Field.Field
					>
				{/snippet}
			</form.AppField>
			<form.AppField
				name="name"
				validators={{ onChange: ({ value }) => validate_name(value), onSubmit: ({ value }) => validate_name(value) }}
			>
				{#snippet children(field)}
					<field.Input label="Quién recoge" placeholder="Tu nombre" autocomplete="off" maxlength={80} />
				{/snippet}
			</form.AppField>
			<form.AppField
				name="contact"
				validators={{
					onChange: ({ value }) => validate_contact(value),
					onSubmit: ({ value }) => validate_contact(value),
				}}
			>
				{#snippet children(field)}
					<field.Input
						label="Celular de contacto"
						placeholder="55 1234 5678"
						inputmode="tel"
						autocomplete="off"
						maxlength={25}
						description="Solo validamos el formato. No verificamos tu identidad, no enviamos mensajes y no guardamos este dato."
					/>
				{/snippet}
			</form.AppField>
			<div>
				<p class="label">Métodos de pago del puesto de ejemplo</p>
				<Payments methods={customer.merchant?.payments ?? []} />
			</div>
		</Field.Group>
	</div>
	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}
	<p class="disclaimer">
		No se realiza una compra, cobro ni reserva. La simulación termina “Por confirmar”. No uses datos personales reales
		para probarla.
	</p>
	<footer>
		<div><span>Total estimado</span><strong>{money(customer.total)}</strong></div>
		<div class="actions">
			<Button variant="outline" onclick={onback}>Volver al catálogo</Button
			><form.AppForm
				><form.Submit pending="Simulando…" disabled={!customer.cart_count}>Simular solicitud</form.Submit></form.AppForm
			>
		</div>
	</footer>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
	}
	.review-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}
	h3 {
		font: 700 1.1rem var(--font-heading);
		margin: 0 0 0.4rem;
	}
	section > p {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		margin: 0;
	}
	select {
		min-height: 2.75rem;
		width: 100%;
		padding: 0.6rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: white;
		color: var(--foreground);
		font: inherit;
		font-size: 0.85rem;
	}
	.label {
		font-size: 0.8rem;
		margin: 0 0 0.5rem;
	}
	.disclaimer {
		margin: 0;
		font-size: 0.75rem;
		color: var(--muted-foreground);
		line-height: 1.6;
	}
	.error {
		color: var(--destructive);
	}
	footer {
		position: sticky;
		bottom: 0;
		margin: 0 -1.5rem -1.5rem;
		padding: 1rem 1.5rem;
		background: var(--background);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;

		border-top: 1px solid var(--border);
	}
	footer > div:first-child {
		display: grid;
		gap: 0.25rem;
		font-size: 0.75rem;
	}
	footer strong {
		font-size: 1.5rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
	}
	@media (max-width: 640px) {
		.review-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		footer {
			bottom: 0;
			margin: 0 -1rem -1rem;
			padding: 1rem;
			align-items: stretch;
			flex-direction: column;
		}
		footer > div:first-child {
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
		.actions :global(button) {
			flex: 1;
			min-width: 0;
			min-height: 2.75rem;
			white-space: normal;
		}
	}
</style>
