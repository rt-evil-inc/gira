<script lang="ts">
	import LocationButton from '$lib/LocationButton.svelte';
	import Login from '$lib/Login.svelte';
	import Map from '$lib/Map.svelte';
	import StationMenu from '$lib/StationMenu.svelte';
	import { token } from '$lib/stores';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { fade } from 'svelte/transition';

	let selectedStation:string|null = null;
	let menuHeight = 0;
	let following = { active: false, status: null };

</script>

<div class="h-full w-full relative overflow-hidden">
	{#if $token === null}
		<div transition:fade={{ duration: 150 }} class="absolute w-full h-full z-20 flex items-center justify-center">
			<Login />
		</div>
	{/if}
	<Map blurred={!$token} bind:selectedStation bind:menuHeight={menuHeight} bind:following={following}/>

	<StationMenu bind:id={selectedStation} bind:bikeListHeight={menuHeight} >
		<div class="absolute right-0 m-4 -top-24">
			<LocationButton bind:following={following}/>
		</div>
	</StationMenu>
</div>