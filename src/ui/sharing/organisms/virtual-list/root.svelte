<script lang="ts" generics="T">
	import { createVirtualizer } from "@tanstack/svelte-virtual";
	import { type Snippet, untrack } from "svelte";
	import { get } from "svelte/store";
	import { cn } from "#utils/shadcn.js";
	import Item from "./item.svelte";

	let {
		items,
		getKey,
		children,
		empty,
		label,
		height = 320,
		estimateSize = 48,
		overscan = 5,
		class: className,
	}: {
		items: readonly T[];
		getKey: (item: T) => string | number;
		children: Snippet<[T, number]>;
		empty?: Snippet;
		label: string;
		height?: number;
		estimateSize?: number;
		overscan?: number;
		class?: string;
	} = $props();

	let viewport = $state<HTMLElement | null>(null);
	const virtualizer = untrack(() =>
		createVirtualizer<HTMLElement, HTMLElement>({
			count: items.length,
			getScrollElement: () => viewport,
			estimateSize: () => estimateSize,
			getItemKey: (index) => getKey(items[index]),
			overscan,
			initialRect: { width: 0, height },
		})
	);

	$effect(() => {
		const currentItems = items;
		const currentKey = getKey;
		const size = estimateSize;
		const element = viewport;
		const options = {
			count: currentItems.length,
			getItemKey: (index: number) => currentKey(currentItems[index]),
			estimateSize: () => size,
			getScrollElement: () => element,
			overscan,
			initialRect: { width: 0, height },
		};
		untrack(() => get(virtualizer).setOptions(options));
	});
</script>

<!-- The scroll viewport needs focus for keyboard scrolling. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->

<section
	bind:this={viewport}
	aria-label={label}
	tabindex="0"
	class={cn("overflow-auto overscroll-contain", className)}
	style:height={`${height}px`}
>
	{#if items.length === 0}
		{@render empty?.()}
	{:else}
		<ul aria-label={label} class="relative w-full" style:height={`${$virtualizer.getTotalSize()}px`}>
			{#each $virtualizer.getVirtualItems() as item (item.key)}
				{#if items[item.index] !== undefined}
					<Item {item} count={items.length} measure={(element) => $virtualizer.measureElement(element)}>
						{@render children(items[item.index], item.index)}
					</Item>
				{/if}
			{/each}
		</ul>
	{/if}
</section>
