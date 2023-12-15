<script lang="ts">
	import { fade } from 'svelte/transition';

	export let offset = 0, pos:number|undefined = 0, left:undefined|number = undefined, right:undefined|number = undefined;
	let lastPos = 0;

	let show = true;
	$: {
		show = false;
		if (pos !== undefined) {
			lastPos = pos;
			setTimeout(() => show = true, 150);
		}
	}
</script>

{#key lastPos}
	{#if show}
		<div transition:fade={{ duration: 150 }} class="absolute" style:left="{left}px" style:right="{right}px" style:top="{lastPos + offset}px">
			<slot />
		</div>
	{/if}
{/key}