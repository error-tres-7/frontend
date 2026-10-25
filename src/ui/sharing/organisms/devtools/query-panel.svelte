<script lang="ts">
	import { TanstackQueryDevtoolsPanel } from "@tanstack/query-devtools";
	import { onlineManager, type QueryClient } from "@tanstack/svelte-query";
	import { untrack } from "svelte";

	let { client, theme = "light" }: { client: QueryClient; theme?: "light" | "dark" } = $props();

	function mount(element: HTMLDivElement) {
		const panel = untrack(
			() => new TanstackQueryDevtoolsPanel({ client, queryFlavor: "Svelte Query", version: "6", onlineManager, theme })
		);
		panel.mount(element);
		$effect(() => {
			panel.setClient(client);
			panel.setTheme(theme);
		});
		return () => panel.unmount();
	}
</script>

<div data-devtools-panel="query" class="h-full min-h-0 overflow-auto" {@attach mount}></div>
