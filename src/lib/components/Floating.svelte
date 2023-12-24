<script lang="ts">
	import { safeInsets } from '$lib/stores';
	import { fade } from 'svelte/transition';

	export let offset = 0, y:number|undefined = 0, left:undefined|number = undefined, right:undefined|number = undefined, bottom = false;
	let pos = 0, innerHeight = 0;

	let show = true;
	$: {
		show = false;
		if (y !== undefined) {
			if (bottom) {
				pos = Math.max((innerHeight - y) + offset, $safeInsets.bottom);
			// console.log(innerHeight - y);
			} else {
				if ($safeInsets.top === 0) pos = y + offset;
				else pos = $safeInsets.top + offset - 16;
				console.log('pos top', pos, y, offset, $safeInsets.top);
			}
			setTimeout(() => show = true, 150);
		}
	}
</script>

<svelte:window bind:innerHeight />

{#key pos}
	{#if show}
		<div transition:fade={{ duration: 150 }} class="absolute" style:left="{left}px" style:right="{right}px" style:top="{bottom ? '' : pos + 'px'}" style:bottom="{bottom ? pos + 'px' : ''}">
			<slot />
		</div>
	{/if}
{/key}