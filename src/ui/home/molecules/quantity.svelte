<script lang="ts">
	import { Minus, Plus } from "@lucide/svelte";

	let {
		value,
		step,
		unit,
		name,
		onchange,
	}: { value: number; step: number; unit: string; name: string; onchange: (quantity: number) => void } = $props();
</script>

<fieldset class="quantity" aria-label={`Cantidad de ${name}`}>
	<button
		type="button"
		disabled={value <= 0}
		onclick={() => onchange(Math.max(0, value - step))}
		aria-label={`Quitar ${step} ${unit} de ${name}`}
	>
		<Minus size={14} />
	</button>
	<output aria-live="polite" aria-label={`Cantidad de ${name}`}>{value} {unit}</output>
	<button
		type="button"
		disabled={value + step > 99}
		onclick={() => onchange(value + step)}
		aria-label={`Agregar ${step} ${unit} de ${name}`}
	>
		<Plus size={14} />
	</button>
</fieldset>

<style>
	.quantity {
		margin: 0;
		padding: 0;
		min-inline-size: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.3rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		color: var(--primary);
		background: white;
	}
	button {
		display: grid;
		place-items: center;
		min-width: 2.75rem;
		min-height: 2.75rem;
		border: 0;
		background: transparent;
		color: inherit;
		cursor: pointer;
		border-radius: 0.4rem;
	}
	button:disabled {
		opacity: 0.35;
		cursor: default;
	}
	output {
		font-size: 0.8rem;
		white-space: nowrap;
	}
</style>
