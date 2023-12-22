<script lang="ts">
	import Floating from '$lib/components/Floating.svelte';
	import LocationButton from '$lib/components/LocationButton.svelte';
	import Login from '$lib/components/Login.svelte';
	import Map from '$lib/components/Map.svelte';
	import ProfileButton from '$lib/components/ProfileButton.svelte';
	import Profile from '$lib/components/Profile.svelte';
	import StationMenu from '$lib/components/StationMenu.svelte';
	import TripStatus from '$lib/components/TripStatus.svelte';
	import { token, currentTrip, safeInsets } from '$lib/stores';
	import { Geolocation } from '@capacitor/geolocation';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { fade } from 'svelte/transition';
	import { watchPosition } from '$lib/location';
	import { onMount } from 'svelte';

	let menuHeight = 0;
	let following:{active:boolean} = { active: false };
	let currentMode:'map'|'trip' = 'map';
	let stationMenuPos:number|undefined = 0;
	let tripStatusPos:number = 0;
	let profileOpen = false;
	let locationPermission = false;

	onMount(() => {
		Geolocation.checkPermissions().then(({ location }) => {
			locationPermission = location == 'granted';
			setTimeout(() => {
				if (locationPermission) {
					following.active = true;
					watchPosition();
				}
			}, 500);
		});
	});
</script>

<div class="h-full w-full relative overflow-hidden">
	{#if $token === null}
		<div transition:fade={{ duration: 150 }} class="absolute w-full h-full z-20 flex items-center justify-center">
			<Login />
		</div>
	{/if}
	<Map blurred={!$token} bind:bottomPadding={menuHeight} bind:topPadding={tripStatusPos} bind:following={following}/>

	{#if $currentTrip !== null}
		<TripStatus bind:posBottom={tripStatusPos} />
	{:else if currentMode == 'map'}
		<StationMenu bind:posTop={stationMenuPos} bind:bikeListHeight={menuHeight} />
	{/if}

	<Floating right={16} pos={stationMenuPos} offset={-64}>
		<LocationButton bind:locationPermission bind:following={following}/>
	</Floating>

	<Floating right={16} pos={tripStatusPos} offset={$safeInsets.top ? $safeInsets.top : 16}>
		<ProfileButton on:click={() => profileOpen = true}/>
	</Floating>
	{#if profileOpen}
		<Profile on:close={() => profileOpen = false}/>
	{/if}
</div>