<script lang="ts">
	import { X } from "@lucide/svelte";
	import type { Snippet } from "svelte";

	let { title, children, onclose }: { title: string; children: Snippet; onclose: () => void } = $props();
	const id = $props.id();

	function mount_dialog(node: HTMLDialogElement) {
		const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		node.showModal();
		node.querySelector("h2")?.focus();
		return () => {
			node.close();
			if (opener?.isConnected) opener.focus();
		};
	}
</script>

<dialog
	{@attach mount_dialog}
	aria-labelledby={id}
	oncancel={(event) => {
		event.preventDefault();
		onclose();
	}}
>
	<header>
		<h2
			{id}
			tabindex="-1"
			{@attach (node) => {
				if (title) node.focus();
			}}
		>
			{title}
		</h2>
		<button class="close" type="button" aria-label="Cerrar y volver" onclick={onclose}><X size={20} /></button>
	</header>
	<div class="content">{@render children()}</div>
</dialog>

<style>
	dialog {
		position: fixed;
		inset: 0;
		width: min(920px, calc(100% - 3rem));
		max-width: none;
		max-height: calc(100dvh - 3rem);
		padding: 0;
		margin: auto;
		border: 1px solid var(--border);
		border-radius: 1rem;
		background: white;
		color: var(--foreground);
		overflow: auto;
		overscroll-behavior: contain;
	}
	dialog::backdrop {
		background: color-mix(in srgb, var(--foreground) 42%, transparent);
	}
	header {
		position: sticky;
		top: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.5rem;
		background: white;
		border-bottom: 1px solid var(--border);
		z-index: 1;
	}
	h2 {
		font: 700 1.35rem var(--font-heading);
		margin: 0;
		outline: none;
	}
	.close {
		display: grid;
		place-items: center;
		min-width: 2.75rem;
		min-height: 2.75rem;
		border: 0;
		border-radius: 50%;
		background: var(--background);
		color: var(--primary);
		cursor: pointer;
	}
	.content {
		padding: 1.5rem;
	}
	@media (max-width: 640px) {
		dialog {
			inset: auto 0 0;
			width: 100%;
			max-height: calc(100dvh - 2rem);
			margin: 0;
			border-radius: 1rem 1rem 0 0;
		}
		header {
			padding: 0.8rem 1rem;
		}
		.content {
			padding: 1rem;
		}
	}
</style>
