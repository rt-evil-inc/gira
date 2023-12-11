<script lang="ts">
	import Login from '$lib/Login.svelte';
	import Map from '$lib/Map.svelte';
	import StationMenu from '$lib/StationMenu.svelte';
	import { token } from '$lib/stores';
	import 'maplibre-gl/dist/maplibre-gl.css';

	let openStation:string|null = null;

</script>

<div class="h-full w-full relative overflow-hidden">
	{#if !$token}
		<div class="absolute w-full h-full z-10 flex items-center justify-center">
			<!-- login -->
			<Login />
		</div>
	{/if}
	<Map on:station-click={e => {
		console.log(e);
		openStation = e.detail;
	}} blurred={!$token}/>
	<StationMenu bind:id={openStation} />
</div>