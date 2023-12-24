<script lang="ts">
	import { errorMessage } from '$lib/stores';
	import { fly } from 'svelte/transition';

	$errorMessage = 'Não tem uma subscrição ativa';
	let show = true;
	$: {
		show = true;
		if (errorMessage) setTimeout(() => show = false, 3000);
	}
</script>

{#if show}
	<div transition:fly={{ y: 80 }} class="absolute bottom-10 left-1/2 -translate-x-1/2 bg-warning py-2 px-3 font-bold text-sm text-background rounded-xl z-50 pointer-events-none w-max max-w-[85vw]">
		{$errorMessage}
	</div>
{/if}