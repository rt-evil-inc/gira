<script lang="ts">
	import type { SvelteComponent } from 'svelte';

	export let text = '';
	export let icon: typeof SvelteComponent;
	export let subtext = '';
</script>
<button class="flex items-center text-left w-full min-h-[70px] rounded-2xl bg-white px-3 gap-3" style:box-shadow="0px 0px 12px 0px rgba(0, 0, 0, 0.10)" on:click >
	<svelte:component this={icon} class="text-primary" size={32} stroke={2} />
	<div>
		<div class="font-bold text-base text-primary">{text}</div>
		<div class="text-xs text-[#B3B3B3] -mt-[2px]">{subtext}</div>
	</div>
</button>