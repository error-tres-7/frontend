<script lang="ts">
	import { ArrowLeftRight, Banknote, CreditCard } from "@lucide/svelte";
	import type { PaymentMethod } from "#lib/merchant/labels.js";

	let { method, size = 16 }: { method: PaymentMethod; size?: number } = $props();
</script>

{#if method === "cash"}
	<Banknote {size} aria-hidden="true" />
{:else if method === "transfer"}
	<ArrowLeftRight {size} aria-hidden="true" />
{:else}
	<CreditCard {size} aria-hidden="true" />
{/if}
