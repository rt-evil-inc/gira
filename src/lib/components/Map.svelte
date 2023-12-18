 <script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import { AttributionControl, GeoJSONSource, Map } from 'maplibre-gl';
	import type { GeoJSON } from 'geojson';

	import { currentTrip, stations, selectedStation } from '$lib/stores';
	import type { Position } from '@capacitor/geolocation';
	import { fade } from 'svelte/transition';
	import { pulsingDot } from '$lib/pulsing-dot';
	import { currentPos } from '$lib/location';
	import type { Unsubscriber } from 'svelte/motion';
	export let blurred = true;
	export let following:{active:boolean} = { active: false };
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
						active: station.serialNumber == $selectedStation,
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
				'icon-image': ['case', ['get', 'active'], ['concat', 'bike_green-', ['get', 'bikes']], ['concat', 'bike_white-', ['get', 'bikes']]],
				'icon-size': ['interpolate', ['linear'], ['zoom'], 12, 0.25, 14, 0.5],
				'icon-anchor': 'bottom',
				'icon-allow-overlap': true,
				'icon-padding': 0,
			},
		});
		map.addLayer({
			'id': 'user-location',
			'type': 'symbol',
			'source': 'user-location',
			'layout': {
				'icon-image': 'pulsing-dot',
			},
		});
	}

	function addEventListeners() {
		map.on('click', 'points', async function (e) {
			if (e.features === undefined) return;
			following.active = false;
			const feature = e.features[0] as GeoJSON.Feature<GeoJSON.Point>;
			const props = feature.properties as { serialNumber: string, name: string, bikes: number };
			$selectedStation = props.serialNumber;
			await tick();
			await tick();
			map.flyTo({
				center: feature.geometry.coordinates as [number, number],
				padding: { bottom: Math.min(menuHeight, window.innerHeight / 2) },
				curve: 0,
			});
		});
		// on dragging map, remove user tracking
		map.on('dragstart', () => {
			following.active = false;
		});
		map.on('click', e => {
			const features = map.queryRenderedFeatures(e.point, { layers: ['points'] });
			if (features.length == 0) {
				$selectedStation = null;
			}
		});
	}
	async function loadImages() {
		map.addImage('pulsing-dot', pulsingDot(map), { pixelRatio: 2 });
		const imgs = [['bike_white', './assets/bike_marker_white.svg', '#79c000'], ['bike_green', './assets/bike_marker_green.svg', '#fff']];
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d', { willReadFrequently: true })!;
		await Promise.all(imgs.map(([name, url, color]) => loadSvg(url).then(img => {
			const start = performance.now();
			context.clearRect(0, 0, img.width, img.height);
			context.drawImage(img, 0, 0);
			const imageWithoutNumber = context.getImageData(0, 0, img.width, img.height);
			canvas.width = img.width;
			canvas.height = img.height;
			context.font = 'bold 44px Inter';
			context.textAlign = 'center';
			context.fillStyle = color;
			for (let i = 0; i < 50; i++) {
				context.putImageData(imageWithoutNumber, 0, 0);
				context.fillText(i.toString(), img.width / 2, img.height / 1.6);
				const newImg = context.getImageData(0, 0, img.width, img.height);
				map.addImage(`${name}-${i}`, newImg);
			}
			console.log(`Loaded images in ${performance.now() - start}ms`);
		})));
	}
	let unsubPos:Unsubscriber;
	async function onMapLoad() {
		mapLoaded = true;
		await loadImages();
		setSourceData();
		addLayers();
		addEventListeners();
		unsubPos = currentPos.subscribe(handleLocUpdate);
	}

	function centerMap(pos: Position) {
		map.flyTo({
			center: [pos.coords.longitude, pos.coords.latitude],
			padding: { bottom: Math.min(menuHeight, window.innerHeight / 2) },
			curve: 0,
		});
	}

	async function handleLocUpdate(pos: Position|null) {
		if (pos && pos.coords) {
			if (following.active) centerMap(pos);
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
				src.setData(data);
			} else {
				map.addSource('user-location', {
					'type': 'geojson',
					'data': { type: 'FeatureCollection', features: [] },
				});
			}
		}
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

	onDestroy(() => {
		if (map) map.remove();
		if (unsubPos) unsubPos();
	});

	$: if ($stations && map) {
		$selectedStation = $selectedStation;
		if (mapLoaded) {
			setSourceData();
		}
	}

	currentTrip.subscribe(trip => {
		if (trip) following.active = true;
	});

	$: if (following.active && map && $currentPos) centerMap($currentPos);

	$: if ($selectedStation == null) menuHeight = 0;
</script>

{#if !mapLoaded || blurred || $stations.length == 0}
	<div out:fade={{ duration: 500 }} class="blur absolute bg-cover top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2000px] h-[2000px] z-10 bg-[url(/assets/map-preview-full.png)]" />
{/if}
<div bind:this={mapElem} class="h-full w-full"></div>