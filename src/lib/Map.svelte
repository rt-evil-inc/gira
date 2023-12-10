 <script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { GeoJSONFeature, GeoJSONSource, Map, Popup, type MapGeoJSONFeature } from 'maplibre-gl';
	import type { GeoJSON } from 'geojson';
	import { stations, token } from '$lib/stores';
	let mapElem: HTMLDivElement;
	let map : Map;
	let mapLoaded = false;
	let dispatch = createEventDispatcher();
	onMount(async () => {
		map = new Map({
			container: mapElem,
			style: 'https://tiles2.intermodal.pt/styles/iml/style.json',
			center: [-9.173, 38.744],
			zoom: 12,
		});
		map.on('load', () => {
			mapLoaded = true;
			let image = new Image;
			image.onload = function () {
				map.addImage('bike_white', image);
				map.addLayer({
					'id': 'points',
					'type': 'symbol',
					'source': 'points',
					'layout': {
						'icon-image': 'bike_white',
						'icon-size': 0.5,
						'icon-anchor': 'bottom',
						'text-field': '{bikes}',
						'text-size': 20,
						'text-offset': [0, -2],
						'text-font': ['Noto Sans Bold'],
					},
					paint: {
						'text-color': '#79c000',
					},
				});
				map.on('click', 'points', function (e) {
					if (e.features === undefined) return;
					const feature = e.features[0];
					const props = feature.properties as { serialNumber: string, name: string, bikes: number };
					dispatch('station-click', props.serialNumber);
				});
			};
			image.src = '/bike_marker_white.svg';
			map.addSource('points', {
				'type': 'geojson',
				'data': { type: 'FeatureCollection', features: [] },
			});
			setSourceData();
		});
	});
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
	$:if ($stations && map) {
		if (mapLoaded) {
			setSourceData();
		}
	}
</script>
<div bind:this={mapElem} class="h-full w-full {$token ? '' : 'blur'}"></div>