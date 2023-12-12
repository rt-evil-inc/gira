<script>
	import { loadUserCreds, loadingTasks } from '$lib/stores';
	import '@fontsource/inter';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/600.css';
	import '@fontsource/inter/700.css';
	import '@fontsource/roboto-mono';
	import { IconLoader2 } from '@tabler/icons-svelte';
	import { onMount } from 'svelte';
	import '../app.css';
	import { fade } from 'svelte/transition';
	import { startWS } from '$lib/gira-api/ws';

	onMount(async () => {
		await loadUserCreds();
		startWS();
	});
</script>

<div class="w-screen h-screen font-sans">
	<slot />
	{#if $loadingTasks.size > 0}
		<div transition:fade={{ duration: 150 }} class="absolute left-2 bottom-2 z-10 rounded-full "><IconLoader2 size={48} stroke={3} class="animate-spin text-primary"/></div>
	{/if}
</div>