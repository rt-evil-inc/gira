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
	import { token, currentTrip, tripRating, safeInsets, selectedStation, following } from '$lib/state';
	import { Geolocation } from '@capacitor/geolocation';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { fade } from 'svelte/transition';
	import { watchPosition } from '$lib/location';
	import { onMount } from 'svelte';
	import Compass from '$lib/components/Compass.svelte';
	import ErrorMessage from '$lib/components/ErrorMessage.svelte';
	import { App } from '@capacitor/app';
	import { getMessage } from '$lib/gira-mais-api/gira-mais-api';
	import { Preferences } from '@capacitor/preferences';

	let menuHeight = 0;
	let stationMenuPos:number|undefined = 0;
	let tripStatusPos:number = 0;
	let profileOpen = false;
	let locationPermission = false;
	let message = '';
	let messageTimestamp:string;

	onMount(() => {
		getMessage().then(async res => {
			if (res) {
				const lastMessageTimestamp = Date.parse((await Preferences.get({ key: 'lastMessageTimestamp' })).value || '0');
				if (res.showAlways || Date.parse(res.timestamp) > lastMessageTimestamp) {
					message = res.message;
					messageTimestamp = res.timestamp;
				}
			}
		});

		Geolocation.checkPermissions().then(({ location }) => {
			locationPermission = location == 'granted';
			setTimeout(() => {
				if (locationPermission) {
					$following = true;
					watchPosition();
				}
			}, 500);
		});

		let backListener = App.addListener('backButton', () => {
			if (!profileOpen) {
				if ($selectedStation != null) {
					$selectedStation = null;
				} else {
					App.exitApp();
				}
			}
		});

		return () => {
			backListener.remove();
		};
	});
</script>

<div class="h-full w-full relative overflow-hidden">
	{#if $token === null}
		<div transition:fade={{ duration: 150 }} class="absolute w-full h-full z-20 flex items-center justify-center">
			<Login />
		</div>
	{/if}
	<Map loading={!$token} bind:bottomPadding={menuHeight} bind:topPadding={tripStatusPos} />

	{#if $currentTrip !== null}
		<TripStatus bind:posBottom={tripStatusPos} />
	{:else}
		<StationMenu bind:posTop={stationMenuPos} bind:bikeListHeight={menuHeight} />
		{#if $tripRating.currentRating != null}
			<TripRating code={$tripRating.currentRating.code} />
		{/if}
	{/if}

	<Floating right={20} y={stationMenuPos} bottom offset={20}>
		<LocationButton bind:locationPermission />
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

{#if message}
	<div transition:fade={{ duration: 150 }} class="absolute top-0 flex items-center justify-center w-full h-full bg-black/50 z-50">
		<div class="bg-background rounded-2xl max-w-sm w-full flex flex-col p-6 m-2" style:box-shadow="0px 0px 20px 0px var(--color-shadow)">
			<div class="text-info font-medium max-h-[70vh] overflow-y-auto">{@html message}</div>
			<div class="flex justify-end mt-4">
				<button class="text-primary font-bold mx-2" on:click={() => { message = ''; Preferences.set({ key: 'lastMessageTimestamp', value: messageTimestamp }); }}>Ok</button>
			</div>
		</div>
	</div>
{/if}