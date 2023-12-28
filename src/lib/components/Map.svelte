 <script lang="ts">
	import { onMount, tick } from 'svelte';
	import { AttributionControl, GeoJSONSource, Map } from 'maplibre-gl';
	import type { GeoJSON } from 'geojson';
	import { currentTrip, stations, selectedStation, token } from '$lib/stores';
	import type { Position } from '@capacitor/geolocation';
	import { fade } from 'svelte/transition';
	import { pulsingDot } from '$lib/pulsing-dot';
	import { currentPos, bearingNorth, bearing } from '$lib/location';
	import type { Unsubscriber } from 'svelte/motion';

	export let loading = true;
	export let following:{active:boolean} = { active: false };
	export let bottomPadding = 0;
	export let topPadding = 0;

	let mapElem: HTMLDivElement;
	let map : Map;
	let mapLoaded = false;
	let ready = false;
	let blurred = true;

	$: ready = mapLoaded && !loading && $stations.length != 0;
	$: if (ready) setTimeout(() => blurred = false, 500);

	$: if ($bearingNorth) map.flyTo({ bearing: 0 });

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
						selected: station.serialNumber == $selectedStation,
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
				// bike if selected, bike_selected otherwise
				// 'icon-image': ['case', ['get', 'selected'], ['concat', 'bike_selected-', ['get', 'bikes']], ['concat', 'bike-', ['get', 'bikes']]],
				// Add case for inService and selected
				visibility: 'visible',
				'icon-image': ['case',
					['get', 'selected'],
					['case',
						['get', 'inService'],
						['concat', 'bike_selected-', ['get', 'bikes']],
						'bike_inactive_selected'],
					['case',
						['get', 'inService'],
						['concat', 'bike-', ['get', 'bikes']],
						'bike_inactive']],

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
				// bike if selected, bike_selected otherwise
				// 'icon-image': ['case', ['get', 'selected'], ['concat', 'bike_selected-', ['get', 'bikes']], ['concat', 'bike-', ['get', 'bikes']]],
				// Add case for inService and selected
				visibility: 'none',
				'icon-image': ['case',
					['get', 'selected'],
					['case',
						['get', 'inService'],
						['concat', 'dock_selected-', ['get', 'freeDocks']],
						'dock_inactive_selected'],
					['case',
						['get', 'inService'],
						['concat', 'dock-', ['get', 'freeDocks']],
						'dock_inactive']],

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
		map.on('rotate', () => {
			bearing.set(map.getBearing());
			bearingNorth.set(false);
		});
	}

	async function loadImages() {
		map.addImage('pulsing-dot', pulsingDot(map), { pixelRatio: 2 });
		map.addImage('bike_inactive', await loadSvg('./assets/bike_marker_inactive.svg'));
		map.addImage('bike_inactive_selected', await loadSvg('./assets/bike_marker_inactive_selected.svg'));
		map.addImage('dock_inactive', await loadSvg('./assets/dock_marker_inactive.svg'));
		map.addImage('dock_inactive_selected', await loadSvg('./assets/dock_marker_inactive_selected.svg'));

		const imgs = [['bike', './assets/bike_marker.svg', '#79c000'], ['bike_selected', './assets/bike_marker_selected.svg', '#fff'], ['dock', './assets/dock_marker.svg', '#79c000'], ['dock_selected', './assets/dock_marker_selected.svg', '#fff']];
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
		console.debug(`Loaded images in ${performance.now() - start}ms`);
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
			if (following.active && !blurred) centerMap(pos);
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

	onMount(() => {
		map = new Map({
			container: mapElem,
			style: 'assets/map-style.json',
			center: [-9.15, 38.744],
			zoom: 11,
			attributionControl: false,
		});
		map.addControl(new AttributionControl, 'bottom-left');
		const loadPromise = loadImages();
		map.on('load', () => onMapLoad(loadPromise));
		return () => {
			map.remove();
			if (unsubPos) unsubPos();
		};
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
			if (mapLoaded) {
				map.setLayoutProperty('points', 'visibility', 'none');
				map.setLayoutProperty('docks', 'visibility', 'visible');
			}
		} else {
			if (mapLoaded) {
				map.setLayoutProperty('points', 'visibility', 'visible');
				map.setLayoutProperty('docks', 'visibility', 'none');
			}
		}
	});

	$: if (following.active && !blurred && $currentPos) centerMap($currentPos);

	$: if ($selectedStation == null) bottomPadding = 0;
</script>

{#if !ready}
	<div out:fade={{ duration: 500 }} class="blur absolute bg-cover top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2000px] h-[2000px] z-10 bg-[url(/assets/map-preview.jpg)]" />
	<svg out:fade={{ duration: 500 }} class="absolute w-20 h-12 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 transition-opacity {$token === null ? 'opacity-0' : 'opacity-100'}" width="62" height="38" viewBox="0 0 62 38" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M11.0862 26.6841L18.6347 20.9505C15.871 17.2807 10.0799 18.3456 7.56726 18.814C13.1653 19.8331 11.0862 26.6841 11.0862 26.6841Z" fill="#79C000"/>
		<path d="M11.0862 26.6848L20.8612 26.8514C20.5211 24.2944 19.7072 22.3752 18.6347 20.9512L11.0862 26.6848Z" fill="#79C000"/>
		<path d="M28.1018 26.9753L23.685 17.1157M28.1018 26.9753L42.185 10.4097M28.1018 26.9753L20.8612 26.8519M23.685 17.1157L19.7388 8.41601M23.685 17.1157L18.6347 20.9517M42.185 10.4097L46.638 22.118L50.2583 26.6853M42.185 10.4097L40.411 5.11738L44.7192 2L37.4785 2.39874M42.185 10.4097H46.245M20.8612 26.8519L11.0862 26.6853M20.8612 26.8519C20.5211 24.2949 19.7072 22.3757 18.6347 20.9517M19.7388 8.41601H16.6254M19.7388 8.41601H24.0833M11.0862 26.6853C11.0862 26.6853 13.1653 19.8343 7.56725 18.8152M11.0862 26.6853L18.6347 20.9517M7.56725 18.8152C10.0798 18.3468 15.871 17.282 18.6347 20.9517M7.56725 18.8152H2.987" stroke="#79C000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
		<g class="animate-spin origin-[11.5026px_26.4977px]">
			<circle cx="11.5026" cy="26.4977" r="9.50259" stroke="#79C000" stroke-width="4"/>
			<path d="M2.10678 26.582H21.0676" stroke="#79C000"/>
			<path d="M6.84695 34.793L16.3274 18.3724" stroke="#79C000"/>
			<path d="M16.3274 34.793L6.84696 18.3724" stroke="#79C000"/>
		</g>
		<g class="animate-spin origin-[50.1864px_26.4903px]">
			<circle cx="50.1864" cy="26.4903" r="9.49523" stroke="#79C000" stroke-width="4"/>
			<path d="M40.7966 26.5762H59.7452" stroke="#79C000"/>
			<path d="M45.5337 34.7793L55.0081 18.3693" stroke="#79C000"/>
			<path d="M55.0081 34.7793L45.5337 18.3693" stroke="#79C000"/>
		</g>
	</svg>
{/if}
<div bind:this={mapElem} class="h-full w-full"></div>