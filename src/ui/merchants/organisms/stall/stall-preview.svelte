<script lang="ts">
	import { Phone, Store } from "@lucide/svelte";
	import { PAYMENT_LABELS, PAYMENT_METHODS, type PaymentMethod } from "#lib/merchant/labels.js";
	import PaymentIcon from "#merchants/molecules/payment-icon.svelte";
	import StatusBadge from "#merchants/molecules/status-badge.svelte";

	let {
		name,
		category,
		place,
		description,
		closes_at,
		open,
		payments,
		phone,
		photo,
	}: {
		name: string;
		category: string;
		place: string;
		description: string;
		closes_at: string;
		open: boolean;
		payments: PaymentMethod[];
		phone: string | null;
		photo: string | null;
	} = $props();
</script>

<section class="tint preview" aria-labelledby="vista-previa" id="vista-previa">
	<h2 id="vista-previa" class="eyebrow">Así te ven tus vecinos</h2>
	{#if photo}
		<img src={photo} alt={`Foto de ${name || "tu puesto"}`} width="290" height="200">
	{:else}
		<span class="photo" aria-hidden="true"><Store size={40} /></span>
	{/if}
	<strong class="name">{name || "Nombre de tu puesto"}</strong>
	{#if category}
		<span class="muted">{category}</span>
	{/if}
	<StatusBadge tone={open ? "ok" : "muted"}
		>{open ? `Abierto · hasta las ${closes_at}` : "Cerrado por hoy"}</StatusBadge
	>
	{#if place}
		<span>{place}</span>
	{/if}
	{#if description}
		<span class="muted">{description}</span>
	{/if}
	<div class="accepts">
		<span>Acepta en el puesto</span>
		{#if payments.length}
			<ul>
				{#each PAYMENT_METHODS.filter((method) => payments.includes(method)) as method (method)}
					<li><PaymentIcon {method} size={14} />{PAYMENT_LABELS[method].label}</li>
				{/each}
			</ul>
		{:else}
			<p>Consulta al comerciante</p>
		{/if}
	</div>
	{#if phone}
		<span class="phone"><Phone size={14} aria-hidden="true" />{phone}</span>
	{/if}
</section>

<style>
	.preview {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.25rem;
		font-size: 0.875rem;
	}
	.eyebrow {
		margin: 0;
		color: var(--leaf);
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	img,
	.photo {
		width: 100%;
		height: 200px;
		border-radius: 8px;
		object-fit: cover;
	}
	.photo {
		display: grid;
		place-items: center;
		background: var(--sage);
		color: var(--leaf);
	}
	.name {
		font: 700 1.5rem / 1.1 var(--font-heading);
		overflow-wrap: anywhere;
	}
	.muted {
		color: var(--muted-ink);
	}
	.accepts {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		font-size: 0.75rem;
	}
	.accepts > span {
		font-weight: 600;
	}
	ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem 0.875rem;
		margin: 0;
		padding: 0;
		list-style: none;
		color: var(--leaf);
	}
	li,
	.phone {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	.accepts p {
		margin: 0;
		color: var(--muted-ink);
	}
</style>
