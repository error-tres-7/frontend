<script lang="ts">
	import Compare from "#merchants/organisms/prices/compare.svelte";
	import type { PageProps } from "./$types";

	let { params }: PageProps = $props();
</script>

<Compare id={params.product} />
