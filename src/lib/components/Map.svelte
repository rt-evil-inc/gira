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
	export let bottomPadding = 0;
	export let topPadding = 0;
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
						inService: station.assetStatus === 'active',
						docks: station.docks,
						freeDocks: station.docks - station.bikes,
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
				// 'icon-image': ['case', ['get', 'active'], ['concat', 'bike_green-', ['get', 'bikes']], ['concat', 'bike_white-', ['get', 'bikes']]],
				// Add case for inService and active
				visibility: 'visible',
				'icon-image': ['case',
					['get', 'active'],
					['concat', 'bike_green-', ['get', 'bikes']],
					['case',
						['get', 'inService'],
						['concat', 'bike_white-', ['get', 'bikes']],
						'bike_gray']],

				'icon-size': ['interpolate', ['linear'], ['zoom'], 11, 0.3, 13, 0.5],
				'icon-anchor': 'bottom',
				'icon-allow-overlap': true,
				'icon-padding': 0,
			},
		});
		map.addLayer({
			'id': 'docks',
			'type': 'symbol',
			'source': 'points',
			'layout': {
				// bike_white if active, bike_green otherwise
				// 'icon-image': ['case', ['get', 'active'], ['concat', 'bike_green-', ['get', 'bikes']], ['concat', 'bike_white-', ['get', 'bikes']]],
				// Add case for inService and active
				visibility: 'none',
				'icon-image': ['case',
					['get', 'active'],
					['concat', 'dock_green-', ['get', 'freeDocks']],
					['case',
						['get', 'inService'],
						['concat', 'dock_white-', ['get', 'freeDocks']],
						'dock_gray']],

				'icon-size': ['interpolate', ['linear'], ['zoom'], 11, 0.3, 13, 0.5],
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
				padding: { top: topPadding, bottom: Math.min(bottomPadding, window.innerHeight / 2) },
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
		map.addImage('bike_gray', await loadSvg('./assets/bike_marker_gray.svg'));
		map.addImage('dock_gray', await loadSvg('./assets/dock_marker_gray.svg'));

		const imgs = [['bike_white', './assets/bike_marker_white.svg', '#79c000'], ['bike_green', './assets/bike_marker_green.svg', '#fff'], ['dock_white', './assets/dock_marker_white.svg', '#79c000'], ['dock_green', './assets/dock_marker_green.svg', '#fff']];
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d', { willReadFrequently: true })!;
		const start = performance.now();
		await Promise.all(imgs.map(([name, url, color]) => loadSvg(url).then(img => {
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
				context.fillText(i.toString(), img.width / 2, img.height / 1.65);
				const newImg = context.getImageData(0, 0, img.width, img.height);
				map.addImage(`${name}-${i}`, newImg);
			}
		})));
		console.log(`Loaded images in ${performance.now() - start}ms`);
	}
	let unsubPos:Unsubscriber;
	async function onMapLoad(loadPromise: Promise<void>) {
		await loadPromise;
		mapLoaded = true;
		setSourceData();
		addLayers();
		addEventListeners();
		unsubPos = currentPos.subscribe(handleLocUpdate);
	}

	function centerMap(pos: Position) {
		map.flyTo({
			center: [pos.coords.longitude, pos.coords.latitude],
			padding: { top: topPadding, bottom: Math.min(bottomPadding, window.innerHeight / 2) },
			zoom: 16,
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
		const loadPromise = loadImages();
		map.on('load', () => onMapLoad(loadPromise));
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
		if (trip) {
			following.active = true;
			// change visibility of layers
			if (map) {
				map.setLayoutProperty('points', 'visibility', 'none');
				map.setLayoutProperty('docks', 'visibility', 'visible');
			}
		} else {
			if (map) {
				map.setLayoutProperty('points', 'visibility', 'visible');
				map.setLayoutProperty('docks', 'visibility', 'none');
			}
		}
	});

	$: if (following.active && map && $currentPos) centerMap($currentPos);

	$: if ($selectedStation == null) bottomPadding = 0;
</script>

{#if !mapLoaded || blurred || $stations.length == 0}
	<div out:fade={{ duration: 500 }} class="blur absolute bg-cover top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2000px] h-[2000px] z-10 bg-[url(/assets/map-preview.jpg)]" />
	<svg out:fade={{ duration: 500 }} class="absolute w-20 h-12 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10" width="57" height="38" viewBox="0 0 57 38" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M10.7469 26.7097L17.5402 20.9704C15.053 17.2971 9.84124 18.363 7.58001 18.8319C12.618 19.852 10.7469 26.7097 10.7469 26.7097Z" fill="#79C000"/>
		<path d="M10.7469 26.7097L19.5439 26.8765C19.2379 24.317 18.5054 22.3959 17.5402 20.9704L10.7469 26.7097Z" fill="#79C000"/>
		<path d="M26.0602 27L22.0853 17.1306M26.0602 27L38.7343 10.418M26.0602 27L19.5439 26.8765M18.5339 8.42235H15.7319M18.5339 8.42235H22.4436M18.5339 8.42235L22.0853 17.1306M10.7469 26.7097C10.7469 26.7097 12.618 19.852 7.58001 18.8319M10.7469 26.7097L19.5439 26.8765M10.7469 26.7097L17.5402 20.9704M22.0853 17.1306L17.5402 20.9704M46 26.7097L42.7419 22.1379L38.7343 10.418M38.7343 10.418L37.1379 5.12046L41.015 2L34.4988 2.39913M7.58001 18.8319C9.84124 18.363 15.053 17.2971 17.5402 20.9704M7.58001 18.8319H3M19.5439 26.8765C19.2379 24.317 18.5054 22.3959 17.5402 20.9704" stroke="#79C000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
		<g class="animate-spin origin-[10.9197px_26.9197px]">
			<circle cx="10.9197" cy="26.9197" r="8.91971" stroke="#79C000" stroke-width="4"/>
			<path d="M2 27H20" stroke="#79C000"/>
			<path d="M6.5 34.7939L15.5 19.2055" stroke="#79C000"/>
			<path d="M15.5 34.7939L6.5 19.2055" stroke="#79C000"/>
		</g>
		<g class="animate-spin origin-[45.9197px_26.9197px]">
			<circle cx="45.9197" cy="26.9197" r="8.91971" stroke="#79C000" stroke-width="4"/>
			<path d="M37 27H55" stroke="#79C000"/>
			<path d="M41.5 34.7939L50.5 19.2055" stroke="#79C000"/>
			<path d="M50.5 34.7939L41.5 19.2055" stroke="#79C000"/>
		</g>
	</svg>
{/if}
<div bind:this={mapElem} class="h-full w-full"></div>