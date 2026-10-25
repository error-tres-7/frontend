<script lang="ts">
	import CustomerProvider from "#home/organisms/customer-provider.svelte";
	import CustomerHeader from "#sharing/organisms/customer-header/root.svelte";
	import type { LayoutProps } from "./$types";

	let { children }: LayoutProps = $props();
</script>

<CustomerProvider>
	<CustomerHeader />
	<div id="contenido" tabindex="-1">{@render children()}</div>
</CustomerProvider>
