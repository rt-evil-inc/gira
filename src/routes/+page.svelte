<script lang="ts">
	import LocationButton from '$lib/components/LocationButton.svelte';
	import Login from '$lib/components/Login.svelte';
	import Map from '$lib/components/Map.svelte';
	import StationMenu from '$lib/components/StationMenu.svelte';
	import TripStatus from '$lib/components/TripStatus.svelte';
	import { token } from '$lib/stores';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { fade } from 'svelte/transition';

	let selectedStation:string|null = null;
	let menuHeight = 0;
	let following = { active: false, status: null };
	let currentMode:'map'|'trip' = 'map';

</script>

<div class="h-full w-full relative overflow-hidden">
	{#if $token === null}
		<div transition:fade={{ duration: 150 }} class="absolute w-full h-full z-20 flex items-center justify-center">
			<Login />
		</div>
	{/if}
	<Map blurred={!$token} bind:selectedStation bind:menuHeight={menuHeight} bind:following={following}/>

	{#if currentMode == 'trip'}
		<TripStatus arrivalTime={'12:53'} bike={'E1203'} destination={true} distance={'12.3'} distanceLeft={'12.3'} speed={'11.5'} time={'00:12:34'} timeLeft={'10'} />
	{:else if currentMode == 'map'}
		<StationMenu bind:id={selectedStation} bind:bikeListHeight={menuHeight} >
			<div class="absolute right-0 m-4 -top-24">
				<LocationButton bind:following={following}/>
			</div>
		</StationMenu>
	{/if}

</div>