<script lang="ts">
	import Floating from '$lib/components/Floating.svelte';
	import LocationButton from '$lib/components/LocationButton.svelte';
	import Login from '$lib/components/Login.svelte';
	import Map from '$lib/components/Map.svelte';
	import ProfileButton from '$lib/components/ProfileButton.svelte';
	import Settings from '$lib/components/Settings.svelte';
	import StationMenu from '$lib/components/StationMenu.svelte';
	import TripStatus from '$lib/components/TripStatus.svelte';
	import { token, currentTrip } from '$lib/stores';
	import { text } from '@sveltejs/kit';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { fade, fly } from 'svelte/transition';

	let menuHeight = 0;
	let following:{active:boolean} =
		{ active: false };
	let currentMode:'map'|'trip' = 'map';
	let stationMenuPos:number|undefined = 0;
	let tripStatusPos:number = 0;
	let settingsOpen = false;
</script>

<div class="h-full w-full relative overflow-hidden">
	{#if $token === null}
		<div transition:fade={{ duration: 150 }} class="absolute w-full h-full z-20 flex items-center justify-center">
			<Login />
		</div>
	{/if}
	<Map blurred={!$token} bind:menuHeight={menuHeight} bind:following={following}/>

	{#if $currentTrip !== null}
		<TripStatus bind:posBottom={tripStatusPos} />
	{:else if currentMode == 'map'}
		<StationMenu bind:posTop={stationMenuPos} bind:bikeListHeight={menuHeight} />
	{/if}

	<Floating right={16} pos={stationMenuPos} offset={-70}>
		<LocationButton bind:following={following}/>
	</Floating>

	<Floating right={16} pos={tripStatusPos} offset={16}>
		<ProfileButton on:click={() => settingsOpen = true}/>
	</Floating>
	{#if settingsOpen}
		<Settings on:close={() => settingsOpen = false}/>
	{/if}

</div>