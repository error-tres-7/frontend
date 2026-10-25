<script lang="ts">
	import MerchantGate from "#merchants/organisms/gate.svelte";
	import MerchantShell from "#merchants/organisms/shell/root.svelte";
	import type { LayoutProps } from "./$types";

	let { children }: LayoutProps = $props();
</script>

<MerchantGate>
	<MerchantShell>{@render children()}</MerchantShell>
</MerchantGate>
