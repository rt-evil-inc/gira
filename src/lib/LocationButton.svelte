<script lang="ts">
	import { draw } from 'svelte/transition';
	export let following = { active: false, status: null };
	const duration = 500;

	function inverseCubicInOut(y:number) {
		// Check which part of the original function's definition applies
		if (y < 0.5) {
			return Math.cbrt(y / 4);
		} else {
			return Math.cbrt((y - 1) / 4) + 1;
		}
	}
</script>
<button class="bg-white p-2 rounded-full grid grid-cols-1 grid-rows-1 w-12 h-12 active:bg-neutral-100 transition-colors" on:click={() => following.active = !following.active}>
	{#if following.active}
		<div style="grid-row: 1;grid-column: 1;" >
			<svg
				xmlns="http://www.w3.org/2000/svg" class="text-primary" width="32" height="32" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
				<path transition:draw={{ duration: duration }} stroke="none" d="M0 0h24v24H0z" fill="none"/>
				<path transition:draw={{ duration: duration }} d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
				<path transition:draw={{ duration: duration }} d="M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0" />
				<path
					in:draw={{ duration: duration * 0.3, delay: inverseCubicInOut(0.728) * duration }}
					out:draw={{ duration: duration * 0.3, delay: inverseCubicInOut(0.25) * duration - (duration * 0.3) }}
					d="M12 4l0 -2" />
				<path
					in:draw={{ duration: duration * 0.3, delay: inverseCubicInOut(0.488) * duration }}
					out:draw={{ duration: duration * 0.3, delay: inverseCubicInOut(0.5) * duration - (duration * 0.3) }}
					d="M20 12l2 0" />
				<path
					in:draw={{ duration: duration * 0.3, delay: inverseCubicInOut(0.228) * duration }}
					out:draw={{ duration: duration * 0.3, delay: inverseCubicInOut(0.5) * duration - (duration * 0.3) }}
					d="M12 20l0 2" />
				<path
					in:draw={{ duration: duration * 0.3, delay: 0 }}
					out:draw={{ duration: duration * 0.3, delay: 0 }}
					d="M4 12l-2 0" />
			</svg>
		</div>
	{:else}
		<div style="grid-row: 1;grid-column: 1;">
			<svg xmlns="http://www.w3.org/2000/svg" class="text-neutral-400" width="32" height="32" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
				<path transition:draw={{ duration: duration }} stroke="none" d="M0 0h24v24H0z" fill="none"/>
				<path transition:draw={{ duration: duration }} d="M14.685 10.661c-.3 -.6 -.795 -1.086 -1.402 -1.374m-3.397 .584a3 3 0 1 0 4.24 4.245" />
				<path transition:draw={{ duration: duration }} d="M6.357 6.33a8 8 0 1 0 11.301 11.326m1.642 -2.378a8 8 0 0 0 -10.597 -10.569" />
				<path
					d="M12 4l0 -2" />
				<path
					d="M12 20l0 2" />
				<path
					d="M20 12h2" />
				<path
					d="M4 12l-2 0" />
				<path transition:draw={{ duration: duration }} d="M3 3l18 18" />
			</svg>

		</div>
	{/if}
</button>