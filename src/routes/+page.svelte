<script lang="ts">
	import { token } from '$lib/stores';
	import { Map } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { onMount } from 'svelte';
	import Login from '$lib/Login.svelte';
	import StationMenu from '$lib/StationMenu.svelte';
	import { getBikes, getDocks } from '$lib/gira-api';
	import { userCredentials } from '$lib/stores';

	let mapElem: HTMLDivElement;

	onMount(async () => {
		let map = new Map({
			container: mapElem,
			style: 'https://tiles2.intermodal.pt/styles/iml/style.json',
			center: [-9.173, 38.744],
			zoom: 12,
		});
		map.on('load', () => console.log('map loaded'));
	});
</script>

<div class="h-full w-full relative overflow-hidden">
	{#if !$token}
		<div class="absolute w-full h-full z-10 flex items-center justify-center">
			<!-- login -->
			<Login />
		</div>
	{/if}
	<div bind:this={mapElem} class="h-full w-full {$token ? '' : 'blur'}"></div>
	<StationMenu id="483" name="Rua Professor Francisco Lucas Pires" bikes={16} freeDocks={2} distance="3.2km" />
</div>