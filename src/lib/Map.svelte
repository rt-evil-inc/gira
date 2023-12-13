 <script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { AttributionControl, GeoJSONSource, Map } from 'maplibre-gl';
	import type { GeoJSON } from 'geojson';

	import { stations } from '$lib/stores';
	import { Geolocation } from '@capacitor/geolocation';
	import { fade } from 'svelte/transition';
	export let blurred = true;
	export let selectedStation:string|null = null;
	export let following:{active:boolean, status:'fix'|'approx'|null} = { active: false, status: null };
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
		} else {
			map.addSource('points', {
				'type': 'geojson',
				'data': { type: 'FeatureCollection', features: [] },
			});
		}
		const userSrc = map.getSource('user-location') as GeoJSONSource|null;
		if (!(userSrc instanceof GeoJSONSource)) {
			map.addSource('user-location', {
				'type': 'geojson',
				'data': { type: 'FeatureCollection', features: [] },
			});
		}
	}
	function loadSvg(url: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			let img = new Image;
			img.onload = _ => resolve(img);
			img.onerror = reject;
			img.src = url;
		});
	}

	function addLayers() {
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
		map.addLayer({
			'id': 'user-location',
			'type': 'circle',
			'source': 'user-location',
			'layout': {},

			paint: {
				'circle-radius': 10,
				'circle-color': '#79c000',
				'circle-stroke-color': '#fff',
				'circle-stroke-width': 4,
			},
		});
	}

	function addEventListeners() {
		map.on('click', 'points', async function (e) {
			if (e.features === undefined) return;
			const feature = e.features[0] as GeoJSON.Feature<GeoJSON.Point>;
			const props = feature.properties as { serialNumber: string, name: string, bikes: number };
			selectedStation = props.serialNumber;
			await tick();
			await tick();
			map.flyTo({
				center: feature.geometry.coordinates as [number, number],
				padding: { bottom: Math.min(menuHeight, window.innerHeight / 2) },
			});
		});
		// on dragging map, remove user tracking
		map.on('dragstart', function () {
			following.active = false;
		});
	}
	function loadImages() {
		const imgs = [['bike_white', './assets/bike_marker_white.svg'], ['bike_green', './assets/bike_marker_green.svg']];
		return Promise.all(imgs.map(([name, url]) => loadSvg(url).then(img => {
			map.addImage(name, img);
		})));
	}

	async function onMapLoad() {
		mapLoaded = true;
		await loadImages();
		setSourceData();
		addLayers();
		addEventListeners();
	}
	let isWatching:string|null = null;
	async function watchUserLocation() {
		if (isWatching) return;
		let perms = await Geolocation.requestPermissions();
		console.log('perms', perms);
		isWatching = await Geolocation.watchPosition({
			enableHighAccuracy: true,
			timeout: 10000,
		}, pos => {
			if (pos && pos.coords) {
				console.log('pos', pos);
				const src = map.getSource('user-location') as GeoJSONSource|null;
				// dont change to GeoJSONSource as building breaks for no apparent reason
				if (src !== null) {
					const data:GeoJSON.GeoJSON = {
						'type': 'FeatureCollection',
						'features': [{
							type: 'Feature',
							properties: {},
							geometry: {
								type: 'Point',
								coordinates: [pos.coords.longitude, pos.coords.latitude],
							},
						}],
					};
					following.status = pos.coords.accuracy < 50 ? 'fix' : 'approx';
					src.setData(data);
					if (following.active) {
						map.flyTo({
							center: [pos.coords.longitude, pos.coords.latitude],
							padding: { bottom: Math.min(menuHeight, window.innerHeight / 2) },
						});
					}
				} else {
					following.status = null;
					map.addSource('user-location', {
						'type': 'geojson',
						'data': { type: 'FeatureCollection', features: [] },
					});
				}
			}
		});
	}

	onMount(async () => {
		map = new Map({
			container: mapElem,
			style: 'https://tiles2.intermodal.pt/styles/iml/style.json',
			center: [-9.15, 38.744],
			zoom: 11,
			attributionControl: false,
		});
		map.addControl(new AttributionControl, 'bottom-left');
		map.on('load', onMapLoad);
	});
	$:if ($stations && map) {
		selectedStation = selectedStation;
		console.log('new stations');
		if (mapLoaded) {
			setSourceData();
		}
	}
	onDestroy(() => {
		if (map) map.remove();
		if (isWatching) {
			Geolocation.clearWatch({ id: isWatching });
		}
	});

	$:if (following.active) {
		watchUserLocation();
	}
</script>

{#if !mapLoaded || blurred || $stations.length == 0}
	<div out:fade={{ duration: 1000 }} class="blur absolute bg-cover top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2000px] h-[2000px] z-10 bg-[url(/assets/map-preview-full.png)]" />
{/if}
<div bind:this={mapElem} class="h-full w-full"></div>