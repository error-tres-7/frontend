<script lang="ts">
	import type { Snippet } from "svelte";
	import { Button } from "#sharing/molecules/button/index.js";

	let { title, children }: { title: string; children: Snippet } = $props();
</script>

<main class="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 px-6 py-12">
	<h1 class="text-3xl font-semibold tracking-tight">{title}</h1>
	<div class="text-muted-foreground">{@render children()}</div>
	<div><Button href="/" variant="outline">Volver al inicio</Button></div>
</main>
