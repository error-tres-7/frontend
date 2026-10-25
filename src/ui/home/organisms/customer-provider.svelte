<script lang="ts">
	import { onMount, type Snippet } from "svelte";
	import { set_customer } from "#lib/customer/context.js";
	import { Customer } from "#lib/customer/customer.svelte.js";

	let { children }: { children: Snippet } = $props();
	const customer = set_customer(new Customer());
	onMount(() => {
		try {
			customer.hydrate(window.localStorage);
		} catch {
			customer.storage_unavailable = true;
		}
	});
</script>

{@render children()}
