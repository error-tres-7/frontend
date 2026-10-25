<script lang="ts">
	import { Button } from "#sharing/molecules/button/index.js";
</script>

<svelte:head>
	<title>Comercio de barrio · En desarrollo</title>
	<meta
		name="description"
		content="Una plataforma en desarrollo para conectar a las personas con los mercados y comercios de su barrio."
	>
</svelte:head>

<main class="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 px-6 py-12">
	<p class="text-sm text-muted-foreground">Chilangatón · Base frontend</p>
	<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">El comercio de tu barrio, más cerca.</h1>
	<p class="text-muted-foreground">
		Estamos construyendo un espacio para descubrir comercios locales y ayudar a quienes los hacen posibles.
	</p>
	<p class="text-sm text-muted-foreground">Prototipo en desarrollo. El diseño y las funcionalidades llegarán pronto.</p>
	<div>
		<Button href="https://shadcn-svelte.com/docs" variant="outline">Documentación de componentes</Button>
	</div>
</main>
