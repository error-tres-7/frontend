<script lang="ts">
	import MerchantShell from "#merchants/organisms/shell/root.svelte";
	import type { LayoutProps } from "./$types";

	let { children }: LayoutProps = $props();
</script>

<MerchantShell>{@render children()}</MerchantShell>
