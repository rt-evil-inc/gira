 <script lang="ts">
	import { createEventDispatcher, onMount, tick } from 'svelte';
	import { GeoJSONSource, Map } from 'maplibre-gl';
	import { stations } from '$lib/stores';
	// import GeoJSON
	import type { GeoJSON } from 'geojson';
	import { fade } from 'svelte/transition';
	export let blurred = true;
	export let selectedStation:string|null = null;
	export let menuHeight = 0;
	let mapElem: HTMLDivElement;
	let map : Map;
	let mapLoaded = false;

	function setSourceData() {
		const src = map.getSource('points') as GeoJSONSource|null;
		if (src instanceof GeoJSONSource) {
			const data:GeoJSON.GeoJSON = {
				'type': 'FeatureCollection',
				'features': $stations.map(station => ({
					type: 'Feature',
					properties: {
						code: station.code,
						serialNumber: station.serialNumber,
						name: station.name,
						bikes: station.bikes,
						active: station.serialNumber == selectedStation,
					},
					geometry: {
						type: 'Point',
						coordinates: [station.longitude, station.latitude],
					},
				})),
			};
			src.setData(data);
		}
	}
	onMount(async () => {
		map = new Map({
			container: mapElem,
			style: 'https://tiles2.intermodal.pt/styles/iml/style.json',
			center: [-9.15, 38.744],
			zoom: 11,
		});
		map.on('load', () => {
			mapLoaded = true;
			let bike_white = new Image;
			let promiseWhite = new Promise((resolve, reject) => {
				bike_white.onload = e => { map.addImage('bike_white', bike_white); resolve(e); };
				bike_white.onerror = reject;
				bike_white.src = './assets/bike_marker_white.svg';
			});
			let bike_green = new Image;
			let promiseGreen = new Promise((resolve, reject) => {
				bike_green.onload = e => { map.addImage('bike_green', bike_green); resolve(e); };
				bike_green.onerror = reject;
				bike_green.src = './assets/bike_marker_green.svg';
			});
			Promise.all([promiseGreen, promiseWhite]).then(
				() => {
					map.addLayer({
						'id': 'points',
						'type': 'symbol',
						'source': 'points',
						'layout': {
							// bike_white if active, bike_green otherwise
							'icon-image': ['case', ['get', 'active'], 'bike_green', 'bike_white'],
							'icon-size': 0.5,
							'icon-anchor': 'bottom',
							'text-field': '{bikes}',
							'text-size': 20,
							'text-offset': [0, -2],
							'text-font': ['Noto Sans Bold'],
						},
						paint: {
							'text-color': ['case', ['get', 'active'], '#fff', '#79c000'],
						},
					});
					map.on('click', 'points', async function (e) {
						if (e.features === undefined) return;
						const feature = e.features[0] as GeoJSON.Feature<GeoJSON.Point>;
						const props = feature.properties as { serialNumber: string, name: string, bikes: number };
						selectedStation = props.serialNumber;
						await tick();
						await tick();
						console.log(menuHeight / 2 - 100);
						map.flyTo({ center: feature.geometry.coordinates as [number, number], zoom: 13, padding: { bottom: Math.min(menuHeight, window.innerHeight / 2) } });
					});
				},
			);
			map.addSource('points', {
				'type': 'geojson',
				'data': { type: 'FeatureCollection', features: [] },
			});
			setSourceData();
		});
	});
	$:if ($stations && map) {
		selectedStation = selectedStation;
		if (mapLoaded) {
			setSourceData();
		}
	}
</script>
{#if !mapLoaded || blurred || $stations.length == 0}
	<div out:fade={{ duration: 1000 }} class="blur absolute bg-cover top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2000px] h-[2000px] z-10 bg-[url(/assets/map-preview-full.png)]" />
{/if}
<div bind:this={mapElem} class="h-full w-full"></div>