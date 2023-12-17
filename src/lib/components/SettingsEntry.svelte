<script lang="ts">
	import type { SvelteComponent } from 'svelte';

	export let text = '';
	export let icon: typeof SvelteComponent;
	export let subtext = '';
</script>
<button class="flex text-left gap-2 items-center bg-white p-2 rounded-2xl active:bg-neutral-100 transition-all" on:click>
	{#if icon}
		<svelte:component this={icon} class="text-neutral-700" size={24} />
	{/if}
	<div class="flex flex-col">
		<span class="text-md font-semibold text-neutral-700">{text}</span>
		<span class="text-xs text-neutral-500">{subtext}</span>
	</div>
</button>
