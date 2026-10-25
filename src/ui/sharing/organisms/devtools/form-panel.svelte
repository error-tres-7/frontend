<script lang="ts">
	import { FormDevtoolsCore } from "@tanstack/form-devtools";

	let { theme = "light" }: { theme?: "light" | "dark" } = $props();
	let failed = $state(false);

	function mount(element: HTMLDivElement) {
		const panel = new FormDevtoolsCore();
		let disposed = false;
		void panel.mount(element, { theme, devtoolsOpen: true }).catch(() => {
			if (!disposed) failed = true;
		});
		return () => {
			disposed = true;
			panel.unmount();
		};
	}
</script>

{#if failed}
	<p role="alert">No se pudieron cargar las herramientas de formularios.</p>
{/if}
<div data-devtools-panel="form" class="h-full min-h-0 overflow-auto" {@attach mount}></div>
