 <script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { GeoJSONFeature, GeoJSONSource, Map, Popup, type MapGeoJSONFeature } from 'maplibre-gl';
	import type { GeoJSON } from 'geojson';
	import { stations, token } from '$lib/stores';
	let mapElem: HTMLDivElement;
	let map : Map;
	let mapLoaded = false;
	let dispatch = createEventDispatcher();

	let selected:string|null = null;

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
						active: station.serialNumber == selected,
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
			center: [-9.173, 38.744],
			zoom: 12,
		});
		map.on('load', () => {
			mapLoaded = true;
			let bike_white = new Image;
			let promiseWhite = new Promise((resolve, reject) => {
				bike_white.onload = resolve;
				bike_white.onerror = reject;
			});
			let bike_green = new Image;
			let promiseGreen = new Promise((resolve, reject) => {
				bike_green.onload = resolve;
				bike_green.onerror = reject;
			});
			Promise.all([promiseGreen, promiseWhite]).then(
				() => {
					map.addImage('bike_white', bike_white);
					map.addImage('bike_green', bike_green);
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
					map.on('click', 'points', function (e) {
						if (e.features === undefined) return;
						const feature = e.features[0];
						const props = feature.properties as { serialNumber: string, name: string, bikes: number };
						selected = props.serialNumber;
						setSourceData();
						dispatch('station-click', props.serialNumber);
					});
				},
			);
			bike_white.src = '/bike_marker_white.svg';
			bike_green.src = '/bike_marker_green.svg';
			map.addSource('points', {
				'type': 'geojson',
				'data': { type: 'FeatureCollection', features: [] },
			});
			setSourceData();
		});
	});
	$:if ($stations && map) {
		if (mapLoaded) {
			setSourceData();
		}
	}
</script>
<div bind:this={mapElem} class="h-full w-full {$token ? '' : 'blur'}"></div>