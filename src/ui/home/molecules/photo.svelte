<script lang="ts">
	import avocado from "./assets/avocado.png";
	import cilantro from "./assets/cilantro.png";
	import lucha from "./assets/lucha.png";
	import tomato from "./assets/tomato.png";

	let { kind, alt = "" }: { kind: "lucha" | "avocado" | "cilantro" | "tomato"; alt?: string } = $props();
	const images = { lucha, avocado, cilantro, tomato };
</script>

<img src={images[kind]} {alt} loading="lazy" width="640" height="640">

<style>
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: inherit;
	}
</style>
