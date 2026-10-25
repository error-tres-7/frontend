<script lang="ts" generics="T">
	import { RotateCw } from "@lucide/svelte";
	import type { Snippet } from "svelte";
	import { failure_message } from "#lib/merchant/errors.js";
	import { Button } from "#sharing/molecules/button/index.js";

	type Query = {
		data: T | undefined;
		error: unknown;
		isPending: boolean;
		isError: boolean;
		isRefetching: boolean;
		refetch: () => unknown;
	};

	let {
		query,
		what,
		children,
		loading,
	}: {
		query: Query;
		/** What is being loaded, for the messages: "tu resumen", "tus pedidos". */
		what: string;
		children: Snippet<[T]>;
		loading?: Snippet;
	} = $props();
</script>

{#if query.data !== undefined}
	{@render children(query.data)}
{:else if query.isError}
	<div class="state" role="alert">
		<p>{failure_message(query.error, `No pudimos cargar ${what}`)}</p>
		<Button variant="outline" disabled={query.isRefetching} onclick={() => query.refetch()}>
			<RotateCw aria-hidden="true" />
			{query.isRefetching ? "Reintentando…" : "Reintentar"}
		</Button>
	</div>
{:else if loading}
	{@render loading()}
{:else}
	<p class="state" role="status">Cargando {what}…</p>
{/if}

<style>
	.state {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin: 0;
		padding: 1.25rem;
		border-radius: 12px;
		background: var(--card);
		color: var(--muted-ink);
		font-size: 0.9375rem;
	}
	div.state p {
		margin: 0;
		color: var(--ink);
		max-width: 60ch;
	}
</style>
