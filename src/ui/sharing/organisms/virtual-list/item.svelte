<script lang="ts">
	import type { VirtualItem } from "@tanstack/svelte-virtual";
	import type { Snippet } from "svelte";

	let {
		item,
		count,
		children,
		measure,
	}: { item: VirtualItem; count: number; children: Snippet; measure: (element: HTMLElement) => void } = $props();
</script>

<li
	aria-posinset={item.index + 1}
	aria-setsize={count}
	data-index={item.index}
	class="absolute top-0 left-0 w-full"
	style:transform={`translateY(${item.start}px)`}
	{@attach measure}
>
	{@render children()}
</li>
