<script lang="ts">
	import DemoMarket from "#home/organisms/market/market.svelte";
	import OfficialMarket from "#home/organisms/market/official-market.svelte";
	import type { PageProps } from "./$types";

	let { data }: PageProps = $props();
</script>

{#if data.demo}
	<DemoMarket />
{:else if data.market}
	<OfficialMarket market={data.market} source={data.source} />
{/if}
