<script lang="ts">
	import type { Snippet } from "svelte";
	import { Button } from "#sharing/molecules/button/index.js";
	import { useFormContext } from "./context.js";

	let {
		children,
		pending = "Enviando…",
		disabled = false,
	}: { children: Snippet; pending?: string; disabled?: boolean } = $props();
	const form = useFormContext();
	const canSubmit = form.useSelector((state) => state.canSubmit);
	const isSubmitting = form.useSelector((state) => state.isSubmitting);
</script>

<Button
	type="submit"
	disabled={disabled || !canSubmit.current || isSubmitting.current}
	aria-busy={isSubmitting.current}
>
	{#if isSubmitting.current}
		{pending}
	{:else}
		{@render children()}
	{/if}
</Button>
