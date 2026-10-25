<script lang="ts">
	import Saved from "#merchants/organisms/prices/saved.svelte";
	import type { PageProps } from "./$types";

	let { params }: PageProps = $props();
</script>

<Saved id={params.product} />
