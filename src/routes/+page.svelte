<script lang="ts">
	import Login from '$lib/Login.svelte';
	import Map from '$lib/Map.svelte';
	import StationMenu from '$lib/StationMenu.svelte';
	import { token } from '$lib/stores';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let selectedStation:string|null = null;
	let menuHeight = 0;

</script>

<div class="h-full w-full relative overflow-hidden">
	{#if !$token}
		<div class="absolute w-full h-full z-20 flex items-center justify-center">
			<!-- login -->
			<Login />
		</div>
	{/if}
	<Map blurred={!$token} bind:selectedStation bind:menuHeight={menuHeight}/>
	<StationMenu bind:id={selectedStation} bind:bikeListHeight={menuHeight} />
</div>