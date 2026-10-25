<script lang="ts">
	import Review from "#merchants/organisms/prices/review.svelte";
	import type { PageProps } from "./$types";

	let { params }: PageProps = $props();
</script>

<Review id={params.product} />
