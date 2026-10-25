<script lang="ts">
	import { Receipt, ShoppingBag } from "@lucide/svelte";
	import { PAYMENT_LABELS } from "#lib/merchant/labels.js";
	import type { Movement } from "#typing/schemas/merchants.js";
	import { clock, signed_mxn } from "#utils/format.js";

	let { movements }: { movements: Movement[] } = $props();
</script>

<section class="card movements" aria-labelledby="movimientos">
	<h2 id="movimientos">Movimientos recientes</h2>
	{#if movements.length}
		<ul>
			{#each movements as movement (movement.id)}
				<li data-kind={movement.kind}>
					<span class="icon" aria-hidden="true">
						{#if movement.kind === "sale"}
							<ShoppingBag size={18} />
						{:else}
							<Receipt size={18} />
						{/if}
					</span>
					<span class="what">
						{movement.label}
						<small>{clock(movement.at)} · {PAYMENT_LABELS[movement.method].label}</small>
					</span>
					<span class="amount">
						<span class="sr-only">{movement.kind === "sale" ? "Entrada" : "Salida"}</span>
						{signed_mxn(movement.kind === "sale" ? movement.amount : -movement.amount)}
					</span>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">Aún no hay movimientos en esta fecha.</p>
	{/if}
	<p class="note">
		{movements.length ? `Últimos ${movements.length} movimientos · ` : ""}las reservas aún no cobradas no se incluyen.
	</p>
</section>

<style>
	.movements {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem 1.375rem;
	}
	h2 {
		margin: 0;
		font: 700 1.375rem var(--font-heading);
	}
	ul {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.icon {
		display: grid;
		flex: none;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 8px;
		background: var(--mint);
		color: var(--leaf);
	}
	[data-kind="expense"] .icon {
		background: var(--warn-bg);
		color: var(--warn);
	}
	.what {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
		font-weight: 600;
	}
	small {
		color: var(--muted-ink);
		font-size: 0.75rem;
		font-weight: 400;
	}
	.amount {
		margin-left: auto;
		color: var(--leaf);
		font-size: 1.0625rem;
		font-weight: 700;
		white-space: nowrap;
	}
	[data-kind="expense"] .amount {
		color: var(--tomato);
	}
	.empty,
	.note {
		margin: 0;
		color: var(--muted-ink);
		font-size: 0.75rem;
	}
	.note::first-letter {
		text-transform: uppercase;
	}
	.empty {
		font-size: 0.875rem;
	}
</style>
