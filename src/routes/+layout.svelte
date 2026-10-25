<script lang="ts">
	import favicon from "#assets/favicon.svg";
	import { create_query_client } from "#lib/query.js";
	import * as Query from "#sharing/organisms/query/index.js";
	import { browser } from "$app/env";
	import type { LayoutProps } from "./$types";
	import "#sharing/styles/app.css";

	let { children }: LayoutProps = $props();
	const client = create_query_client(browser);
	const tools = import.meta.env.DEV && browser ? import("#sharing/organisms/devtools/index.js") : undefined;
</script>

<svelte:head><link rel="icon" href={favicon}></svelte:head>

<Query.Root {client}>
	{@render children()}
	{#if tools}
		{#await tools then devtools}
			<devtools.Root {client} />
		{/await}
	{/if}
</Query.Root>
