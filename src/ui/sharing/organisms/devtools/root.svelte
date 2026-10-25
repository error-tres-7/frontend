<script lang="ts">
	import { TanStackDevtools, type TanStackDevtoolsSveltePlugin } from "@tanstack/svelte-devtools";
	import type { QueryClient } from "@tanstack/svelte-query";
	import FormPanel from "./form-panel.svelte";
	import QueryPanel from "./query-panel.svelte";

	let { client, plugins = [] }: { client: QueryClient; plugins?: TanStackDevtoolsSveltePlugin[] } = $props();
	let panels: TanStackDevtoolsSveltePlugin[] = $derived([
		{ name: "Query", component: QueryPanel, props: { client } },
		{ name: "Form", component: FormPanel },
		...plugins,
	]);
</script>

<TanStackDevtools plugins={panels} config={{ position: "bottom-right", triggerMode: "fixed" }} />
