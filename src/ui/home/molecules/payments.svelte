<script lang="ts">
	import { ArrowLeftRight, Banknote, CreditCard } from "@lucide/svelte";

	let { methods }: { methods: string[] } = $props();
</script>

<ul class="payments" aria-label="Métodos de pago ilustrativos">
	{#each methods as method (method)}
		<li>
			{#if method === "Efectivo"}
				<Banknote size={13} />
			{:else if method === "Tarjeta"}
				<CreditCard size={13} />
			{:else}
				<ArrowLeftRight size={13} />
			{/if}
			{method}
		</li>
	{/each}
</ul>

<style>
	.payments {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.8rem;
		font-size: 0.75rem;
		color: var(--primary);
	}
	li {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
</style>
