<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		tone = "ok",
		children,
		class: className = "",
	}: { tone?: "warn" | "ok" | "muted" | "alert" | "lime"; children: Snippet; class?: string } = $props();
</script>

<span class="badge {className}" data-tone={tone}>{@render children()}</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		width: fit-content;
		padding: 0.3125rem 0.625rem;
		border-radius: 5px;
		font-size: 0.75rem;
		font-weight: 700;
		line-height: 1.2;
		white-space: nowrap;
	}
	[data-tone="ok"] {
		background: var(--mint);
		color: var(--leaf);
	}
	[data-tone="warn"] {
		background: var(--warn-bg);
		color: var(--warn);
	}
	[data-tone="muted"] {
		background: var(--muted-bg);
		color: var(--muted-ink);
	}
	[data-tone="alert"] {
		background: var(--alert-bg);
		color: var(--tomato);
	}
	[data-tone="lime"] {
		background: var(--lime);
		color: var(--ink);
	}
</style>
