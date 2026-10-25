<script lang="ts">
	import { Check, Clock } from "@lucide/svelte";
	import { createMutation, useQueryClient } from "@tanstack/svelte-query";
	import { markets } from "#lib/markets/index.js";
	import { failure_message } from "#lib/merchant/errors.js";
	import { merchant_keys } from "#lib/merchant/keys.js";
	import {
		CATEGORIES,
		PAYMENT_LABELS,
		PAYMENT_METHODS,
		type PaymentMethod,
		STALL_KIND_LABELS,
		STALL_KINDS,
		WEEK_DAYS,
	} from "#lib/merchant/labels.js";
	import PaymentIcon from "#merchants/molecules/payment-icon.svelte";
	import { StallSchema } from "#schemas/merchants/stall/index.js";
	import { stall } from "#services/merchants/index.js";
	import * as Field from "#sharing/molecules/field/index.js";
	import { createAppForm } from "#sharing/organisms/form/index.js";
	import type { Profile, StallInput, StallValues } from "#typing/schemas/merchants.js";
	import StallPreview from "./stall-preview.svelte";

	let { profile }: { profile: Profile } = $props();

	const client = useQueryClient();
	let saved = $state(false);

	// Official directory grouped by alcaldía; a market the directory lacks stays selectable.
	const groups = Object.entries(Object.groupBy(markets, (market) => market.borough || "Sin alcaldía"))
		.sort(([a], [b]) => a.localeCompare(b, "es-MX"))
		.map(([label, items]) => ({
			label,
			options: (items ?? [])
				.map((market) => ({ value: market.id, label: market.name }))
				.sort((a, b) => a.label.localeCompare(b.label, "es-MX")),
		}));
	let extra = $derived(
		profile.market_id && !markets.some((market) => market.id === profile.market_id)
			? [{ value: profile.market_id, label: profile.market_name ?? profile.market_id }]
			: []
	);

	const draft = (source: Profile): StallInput => ({
		public_name: source.public_name,
		kind: source.kind,
		category: source.category,
		market_id: source.market_id ?? "",
		stall: source.stall,
		aisle: source.aisle,
		description: source.description,
		days: source.days,
		opens_at: source.opens_at,
		closes_at: source.closes_at,
		payments: source.payments,
		show_phone: source.show_phone,
		phone: source.phone ?? "",
	});

	const save = createMutation(() => ({
		mutationFn: (body: StallValues) => stall.save({ body }),
		onSuccess: (updated) => {
			client.setQueryData(merchant_keys.profile(), updated);
			saved = true;
			form.reset(draft(updated));
		},
	}));

	const form = createAppForm(() => ({
		defaultValues: draft(profile),
		validators: { onSubmit: StallSchema.StallForm },
		onSubmit: async ({ value }) => {
			saved = false;
			await save.mutateAsync(StallSchema.StallForm.parse(value)).catch(() => undefined);
		},
	}));

	const values = form.useSelector((state) => state.values);
	let market_name = $derived(
		[...extra, ...groups.flatMap((group) => group.options)].find((option) => option.value === values.current.market_id)
			?.label ?? ""
	);
	let place = $derived(
		[
			values.current.kind === "market" ? market_name.replace(/^Mercado\s+/i, "") : "",
			[values.current.stall && `Local ${values.current.stall}`, values.current.aisle].filter(Boolean).join(", "),
		]
			.filter(Boolean)
			.join(" · ")
	);
	const kinds = STALL_KINDS.map((value) => ({ value, label: STALL_KIND_LABELS[value] }));
	const days = WEEK_DAYS.map((day) => ({ value: day.value as number, label: day.short, name: day.name }));
	const payments = PAYMENT_METHODS.map((value) => ({ value, ...PAYMENT_LABELS[value] }));
</script>

<form
	novalidate
	class="stall"
	onsubmit={async (event) => {
		event.preventDefault();
		const element = event.currentTarget;
		await form.handleSubmit();
		if (!form.state.isValid)
			element.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"] input')?.focus();
	}}
>
	<div class="card main">
		<section aria-labelledby="info-negocio">
			<h2 id="info-negocio">Información del negocio</h2>
			<Field.Group class="gap-4">
				<form.AppField name="public_name">
					{#snippet children(field)}
						<field.Input label="Nombre que verán tus clientes" maxlength={60} autocomplete="organization" />
					{/snippet}
				</form.AppField>
				<form.AppField name="kind">
					{#snippet children(field)}
						<field.Choices legend="¿Dónde vendes?" options={kinds} />
					{/snippet}
				</form.AppField>
				<form.AppField name="category">
					{#snippet children(field)}
						<field.Select
							label="Giro de venta"
							placeholder="Elige tu giro"
							description="Da contexto a tus referencias de precios."
							options={CATEGORIES.map((category) => ({ value: category, label: category }))}
						/>
					{/snippet}
				</form.AppField>
				{#if values.current.kind === "market"}
					<form.AppField name="market_id">
						{#snippet children(field)}
							<field.Select label="Mercado al que pertenece" placeholder="Elige tu mercado" options={extra} {groups} />
						{/snippet}
					</form.AppField>
				{/if}
				<div class="pair">
					<form.AppField name="stall">
						{#snippet children(field)}
							<field.Input label="Número de local" maxlength={10} autocomplete="off" />
						{/snippet}
					</form.AppField>
					<form.AppField name="aisle">
						{#snippet children(field)}
							<field.Input label="Pasillo o referencia" maxlength={40} autocomplete="off" />
						{/snippet}
					</form.AppField>
				</div>
				<form.AppField name="description">
					{#snippet children(field)}
						<field.Input label="Descripción corta" maxlength={140} autocomplete="off" />
					{/snippet}
				</form.AppField>
			</Field.Group>
		</section>

		<section aria-labelledby="horario">
			<h2 id="horario">¿Cuándo pueden visitarte?</h2>
			<Field.Group class="gap-4">
				<form.AppField name="days">
					{#snippet children(field)}
						<field.Choices legend="Días de atención" options={days} multiple class="days" />
					{/snippet}
				</form.AppField>
				<div class="pair">
					<form.AppField name="opens_at">
						{#snippet children(field)}
							<field.DateTime label="Abres a las">
								{#snippet icon()}
									<Clock size={18} />
								{/snippet}
							</field.DateTime>
						{/snippet}
					</form.AppField>
					<form.AppField name="closes_at">
						{#snippet children(field)}
							<field.DateTime label="Cierras a las">
								{#snippet icon()}
									<Clock size={18} />
								{/snippet}
							</field.DateTime>
						{/snippet}
					</form.AppField>
				</div>
			</Field.Group>
		</section>

		<section aria-labelledby="formas-pago" id="formas-de-pago">
			<h2 id="formas-pago">¿Qué formas de pago aceptas?</h2>
			<form.AppField name="payments">
				{#snippet children(field)}
					<field.Choices
						legend="Selecciona todas las que ofreces en tu puesto."
						description="Tus clientes verán estas opciones antes de apartar. Aceptar no registra cobros."
						options={payments}
						multiple
						variant="card"
						class="payments"
					>
						{#snippet option(choice: { value: PaymentMethod; label: string; hint?: string }, checked: boolean)}
							<span class="choice-copy">
								<span>{choice.label}</span>
								<small>{choice.hint}</small>
							</span>
							<span class="choice-icon" data-checked={checked}><PaymentIcon method={choice.value} size={18} /></span>
						{/snippet}
					</field.Choices>
				{/snippet}
			</form.AppField>
		</section>

		{#if save.isError}
			<p class="error" role="alert">
				{failure_message(save.error, "No se actualizó tu puesto")}
				Tus datos siguen aquí.
			</p>
		{/if}
		{#if saved && !save.isError}
			<p class="saved" role="status">
				<Check size={16} aria-hidden="true" />Cambios guardados. Tu puesto ya está actualizado.
			</p>
		{/if}
		<form.AppForm>
			<form.Submit pending="Guardando…">
				<Check aria-hidden="true" />{save.isError ? "Reintentar" : "Guardar y actualizar puesto"}
			</form.Submit>
		</form.AppForm>
	</div>

	<aside class="side" aria-label="Vista previa y privacidad">
		<StallPreview
			name={values.current.public_name}
			category={values.current.category}
			{place}
			description={values.current.description}
			closes_at={values.current.closes_at}
			open={profile.open}
			payments={values.current.payments as PaymentMethod[]}
			phone={values.current.show_phone && values.current.phone ? values.current.phone : null}
			photo={profile.photo_url}
		/>
		<section class="card privacy" aria-labelledby="privacidad">
			<h2 id="privacidad">Tú decides qué compartir</h2>
			<p>Tu celular de acceso no se publica. Activa un teléfono de contacto solo si lo deseas.</p>
			<form.AppField name="show_phone">
				{#snippet children(field)}
					<field.Switch label="Mostrar teléfono público" />
				{/snippet}
			</form.AppField>
			{#if values.current.show_phone}
				<form.AppField name="phone">
					{#snippet children(field)}
						<field.Input label="Teléfono de contacto" inputmode="tel" autocomplete="tel" maxlength={20} />
					{/snippet}
				</form.AppField>
			{/if}
		</section>
	</aside>
</form>

<style>
	.stall {
		display: grid;
		gap: 1.25rem;
		align-items: start;
	}
	.main {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem;
	}
	section + section {
		padding-top: 1.5rem;
		border-top: 1px solid var(--line);
	}
	h2 {
		margin: 0 0 1rem;
		font: 700 1.375rem var(--font-heading);
	}
	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.main :global(.days) {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.375rem;
	}
	.main :global(.days .choice) {
		justify-content: center;
		padding-inline: 0;
	}
	.main :global(.days .choice[data-checked="false"]) {
		background: var(--card);
	}
	.main :global(.payments) {
		display: grid;
		grid-template-columns: 1fr;
	}
	.choice-copy {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.choice-copy small {
		color: var(--muted-ink);
		font-size: 0.75rem;
		font-weight: 400;
	}
	.choice-icon {
		margin-left: auto;
		color: var(--muted-ink);
	}
	.choice-icon[data-checked="true"] {
		color: var(--leaf);
	}
	.main :global([data-slot="button"][type="submit"]) {
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
	.side {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.privacy {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem;
	}
	.privacy h2 {
		margin: 0;
		font-size: 1.1875rem;
	}
	.privacy p {
		margin: 0;
		color: var(--muted-ink);
		font-size: 0.8125rem;
		line-height: 1.5;
	}
	@media (min-width: 768px) {
		.main :global(.payments) {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	@media (min-width: 1100px) {
		.stall {
			grid-template-columns: minmax(0, 1fr) 330px;
		}
		.side {
			position: sticky;
			top: 1.5rem;
		}
	}
</style>
