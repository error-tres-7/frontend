<script lang="ts">
	import { Trash2 } from "@lucide/svelte";
	import Photo from "#home/molecules/photo.svelte";
	import Quantity from "#home/molecules/quantity.svelte";
	import { money } from "#lib/customer/catalog.js";
	import { get_customer } from "#lib/customer/context.js";

	let { editable = false }: { editable?: boolean } = $props();
	const customer = get_customer();
</script>

<ul class="lines">
	{#each customer.lines as line (line.product.id)}
		<li>
			<div class="photo"><Photo kind={line.product.image} /></div>
			<div class="product">
				<strong>{line.product.name}</strong><small>{money(line.product.price)} / {line.product.unit}</small>
				{#if editable && customer.merchant}
					<Quantity
						value={line.quantity}
						step={line.product.step}
						unit={line.product.unit}
						name={line.product.name}
						onchange={(quantity) =>
							customer.merchant && customer.set_quantity(customer.merchant.id, line.product.id, quantity)}
					/>
				{:else}
					<span>{line.quantity} {line.product.unit}</span>
				{/if}
			</div>
			<div class="amount">
				<strong>{money(line.amount)}</strong>
				{#if editable}
					<button
						type="button"
						aria-label={`Eliminar ${line.product.name}`}
						onclick={() => customer.merchant && customer.set_quantity(customer.merchant.id, line.product.id, 0)}
					>
						<Trash2 size={16} />
					</button>
				{/if}
			</div>
		</li>
	{/each}
</ul>

<style>
	.lines {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	li {
		display: flex;
		gap: 0.8rem;
		padding: 1rem 0;
		border-bottom: 1px solid var(--border);
	}
	.photo {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 0.4rem;
		flex-shrink: 0;
	}
	.product {
		display: flex;
		flex: 1;
		min-width: 0;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.85rem;
	}
	small,
	.product > span {
		font-size: 0.75rem;
		color: var(--muted-foreground);
	}
	.product :global(.quantity) {
		max-width: 10rem;
		margin-top: 0.4rem;
	}
	.amount {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		justify-content: space-between;
		font-size: 0.85rem;
		gap: 0.5rem;
	}
	button {
		display: grid;
		place-items: center;
		min-width: 2.75rem;
		min-height: 2.75rem;
		border: 0;
		background: transparent;
		color: var(--muted-foreground);
		cursor: pointer;
	}
</style>
