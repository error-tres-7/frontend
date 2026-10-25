<script lang="ts">
	import { ArrowLeft } from "@lucide/svelte";
	import type { Snippet } from "svelte";

	let {
		title,
		subtitle,
		back,
		actions,
	}: { title: string; subtitle?: string; back?: { href: string; label: string }; actions?: Snippet } = $props();
</script>

<header class="page-header">
	{#if back}
		<a class="back" href={back.href}><ArrowLeft size={18} aria-hidden="true" />{back.label}</a>
	{/if}
	<div class="row">
		<div class="titles">
			<h1>{title}</h1>
			{#if subtitle}
				<p>{subtitle}</p>
			{/if}
		</div>
		{#if actions}
			<div class="actions">{@render actions()}</div>
		{/if}
	</div>
</header>

<style>
	.page-header {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
		width: fit-content;
		min-height: 44px;
		color: var(--leaf);
		font-size: 0.875rem;
		font-weight: 600;
	}
	.back:hover {
		text-decoration: underline;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem 1.25rem;
	}
	.titles {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 0;
	}
	h1 {
		margin: 0;
		font: 700 clamp(1.75rem, 1.2rem + 1.6vw, 2.25rem) / 1.05 var(--font-heading);
		letter-spacing: -0.02em;
	}
	p {
		margin: 0;
		color: var(--muted-ink);
		font-size: 0.9375rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}
	@media (max-width: 639px) {
		.actions {
			width: 100%;
		}
	}
</style>
