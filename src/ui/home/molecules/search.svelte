<script lang="ts">
	import { Search, X } from "@lucide/svelte";

	let {
		value = $bindable(""),
		label,
		placeholder = "Jitomate, aguacate…",
	}: { value?: string; label: string; placeholder?: string } = $props();
	const id = $props.id();
</script>

<div class="search">
	<label for={id}>{label}</label>
	<div class="control">
		<Search size={18} aria-hidden="true" />
		<input {id} type="search" bind:value {placeholder} autocomplete="off">
		{#if value}
			<button type="button" onclick={() => (value = "")} aria-label={`Limpiar ${label.toLowerCase()}`}>
				<X size={16} />
			</button>
		{/if}
	</div>
</div>

<style>
	.search {
		display: grid;
		gap: 0.5rem;
	}
	label {
		font-size: 0.8rem;
		font-weight: 500;
	}
	.control {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.35rem 0.75rem;
		background: white;
		border: 1px solid var(--border);
		border-radius: 0.6rem;
		color: var(--primary);
	}
	.control:focus-within {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}
	input {
		min-width: 0;
		width: 100%;
		padding: 0.5rem 0;
		border: 0;
		outline: none;
		background: transparent;
		color: var(--foreground);
		font: inherit;
		font-size: 0.9rem;
	}
	input::-webkit-search-cancel-button {
		display: none;
	}
	button {
		display: grid;
		place-items: center;
		min-width: 2.75rem;
		min-height: 2.75rem;
		border: 0;
		border-radius: 0.4rem;
		color: inherit;
		background: var(--background);
		cursor: pointer;
	}
</style>
