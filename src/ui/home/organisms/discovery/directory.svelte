<script lang="ts">
	import { ArrowUpRight, MapPin } from "@lucide/svelte";
	import type { Market } from "#lib/markets/index.js";
	import * as VirtualList from "#sharing/organisms/virtual-list/index.js";
	import { resolve } from "$app/paths";

	let { markets, onselect }: { markets: Market[]; onselect: (market: Market) => void } = $props();
</script>

<VirtualList.Root
	items={markets}
	getKey={(market) => market.id}
	label="Directorio de mercados"
	height={390}
	estimateSize={95}
	class="rounded-xl border border-border bg-card"
>
	{#snippet children(market)}
		<div class="flex min-h-[95px] items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
			<div class="min-w-0">
				<a
					class="inline-flex items-center gap-2 font-semibold hover:underline"
					href={resolve("/(customers)/mercados/[id]", { id: market.id })}
					>{market.name}<ArrowUpRight class="size-4 shrink-0" aria-hidden="true" /></a
				>
				<p class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
					<MapPin class="size-3.5 shrink-0" aria-hidden="true" />{market.neighborhood}
					· {market.borough}
				</p>
			</div>
			<button
				class="min-h-11 shrink-0 cursor-pointer text-xs font-semibold text-primary underline underline-offset-4"
				type="button"
				onclick={() => onselect(market)}
			>
				Ver en mapa
			</button>
		</div>
	{/snippet}
</VirtualList.Root>
