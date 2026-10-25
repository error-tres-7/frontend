<script lang="ts">
	import type { Snippet } from "svelte";

	let { title, description, children }: { title: string; description: string; children?: Snippet } = $props();
</script>

<section class="empty">
	<h2>{title}</h2>
	<p>{description}</p>
	{@render children?.()}
</section>

<style>
	.empty {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
		border: 1px solid var(--border);
		border-radius: 0.8rem;
		padding: 2rem;
		background: white;
	}
	h2 {
		font: 700 1.35rem var(--font-heading);
		margin: 0;
	}
	p {
		margin: 0;
		color: var(--muted-foreground);
		line-height: 1.6;
	}
</style>
