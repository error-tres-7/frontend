<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "#utils/shadcn.js";

	let {
		children,
		caption,
		class: className,
		...props
	}: HTMLAttributes<HTMLElement> & { children: Snippet; caption?: Snippet } = $props();
</script>

<figure {...props} class={cn("flex min-w-0 flex-col gap-3", className)}>
	{@render children()}
	{#if caption}
		<figcaption class="text-sm text-muted-foreground">{@render caption()}</figcaption>
	{/if}
</figure>
