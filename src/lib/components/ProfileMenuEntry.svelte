<script lang="ts">
	import { IconExternalLink } from '@tabler/icons-svelte';
	import type { SvelteComponent } from 'svelte';

	export let text = '';
	export let icon: typeof SvelteComponent;
	export let subtext = '';
	export let iconClass = '';
	export let external = false;
</script>

<button class="flex items-center text-left w-full min-h-[70px] rounded-2xl bg-background active:bg-background-secondary transition-colors px-3 gap-3 dark:bg-background-secondary" style:box-shadow="0px 0px 12px 0px var(--color-shadow)" on:click >
	<svelte:component this={icon} class="text-primary {iconClass}" size={32} stroke={2} />
	<div>
		<div class="font-bold text-base text-info">{text}</div>
		<div class="text-xs font-semibold text-label -mt-[2px]">{subtext}</div>
	</div>
	{#if external}
		<IconExternalLink size={20} stroke={2} class="text-background-tertiary ml-auto mr-1.5" />
	{/if}
</button>