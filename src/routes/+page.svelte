<script lang="ts">
	import Floating from '$lib/components/Floating.svelte';
	import LocationButton from '$lib/components/LocationButton.svelte';
	import Login from '$lib/components/Login.svelte';
	import Map from '$lib/components/Map.svelte';
	import ProfileButton from '$lib/components/ProfileButton.svelte';
	import Profile from '$lib/components/Profile.svelte';
	import StationMenu from '$lib/components/StationMenu.svelte';
	import TripStatus from '$lib/components/TripStatus.svelte';
	import TripRating from '$lib/components/TripRating.svelte';
	import { token, currentTrip, tripRating, safeInsets } from '$lib/stores';
	import { Geolocation } from '@capacitor/geolocation';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { fade } from 'svelte/transition';
	import { watchPosition } from '$lib/location';
	import { onMount } from 'svelte';
	import Compass from '$lib/components/Compass.svelte';
	import ErrorMessage from '$lib/components/ErrorMessage.svelte';

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
	<Map loading={!$token} bind:bottomPadding={menuHeight} bind:topPadding={tripStatusPos} bind:following />

	{#if $currentTrip !== null}
		<TripStatus bind:posBottom={tripStatusPos} />
	{:else if currentMode == 'map'}
		<StationMenu bind:posTop={stationMenuPos} bind:bikeListHeight={menuHeight} />
		{#if $tripRating.currentRating != null}
			<TripRating code={$tripRating.currentRating.code} />
		{/if}
	{/if}

	<Floating right={20} y={stationMenuPos} bottom offset={20}>
		<LocationButton bind:locationPermission bind:following={following}/>
	</Floating>

	<Floating right={16} y={tripStatusPos} offset={16}>
		<ProfileButton on:click={() => profileOpen = true}/>
	</Floating>

	<Floating right={20} y={Math.max(tripStatusPos + 16, $safeInsets.top)} offset={70}>
		<Compass />
	</Floating>

	{#if profileOpen}
		<Profile on:close={() => profileOpen = false}/>
	{/if}

	<ErrorMessage />
</div>