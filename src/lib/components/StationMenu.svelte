<script lang="ts">
	import { tweened } from 'svelte/motion';
	import Bike from '$lib/components/Bike.svelte';
	import { cubicOut } from 'svelte/easing';
	import { getStationInfo } from '$lib/gira-api';
	import { onDestroy, onMount } from 'svelte';
	import { stations, selectedStation, type StationInfo } from '$lib/stores';
	import { tick } from 'svelte';
	import { currentPos } from '$lib/location';
	import { distanceBetweenCoords, formatDistance } from '$lib/utils';
	import { fade } from 'svelte/transition';
	import { App } from '@capacitor/app';
	import type { PluginListenerHandle } from '@capacitor/core';

	export let bikeListHeight = 0;
	export let posTop:number|undefined = 0;
	let initPos = 0;
	let pos = tweened($selectedStation != null ? 0 : 9999, { duration: 150, easing: cubicOut });
	let dragged:HTMLDivElement;
	let dismiss = () => {
		pos.set(dragged.clientHeight);
		$selectedStation = null;
	};
	let name = '', bikes = 0, freeDocks = 0, distance:number, code = '',
		bikeInfo: {type:'electric'|'classic', id:string, battery:number|null, dock:string, serial:string}[] = [];
	let isScrolling = false;
	let dragging = false;
	let timeout:ReturnType<typeof setTimeout>;
	let bikeList:HTMLDivElement;
	let menu:HTMLDivElement;
	let updating = false;
	let windowHeight:number;
	let station:StationInfo|undefined;

	$: if ($currentPos && station) {
		distance = distanceBetweenCoords(station.latitude, station.longitude, $currentPos.coords.latitude, $currentPos.coords.longitude);
	}

	$: if ($pos !== null && !dragging && !updating) {
		posTop = Math.min(menu?.getBoundingClientRect().y, windowHeight);
	} else {
		posTop = undefined;
	}

	function onTouchStart(event: TouchEvent) {
		initPos = event.touches[0].clientY - $pos;
	}
	function onTouchMove(event: TouchEvent) {
		dragging = true;
		let newPos = Math.max(event.touches[0].clientY - initPos, 0);
		pos.set(newPos, { duration: 0 });
	}
	function onTouchEnd() {
		dragging = false;
		if (Math.abs($pos) > dragged.clientHeight * 0.3) {
			dismiss();
		} else {
			pos.set(0);
		}
	}

	async function updateInfo(stationId:string) {
		updating = true;
		clearTimeout(timeout);
		if ($stations) {
			station = $stations.find(s => s.serialNumber == $selectedStation);
			if (station) {
				name = station.name.split('-', 2)[1].trim();
				bikes = station.bikes;
				freeDocks = station.docks - station.bikes;
				code = station.name.split('-', 2)[0].trim();
				if ($currentPos) distance = distanceBetweenCoords(station.latitude, station.longitude, $currentPos.coords.latitude, $currentPos.coords.longitude);
			}
		}
		await tick();
		bikeListHeight = bikeList.clientHeight;
		let info = await getStationInfo(stationId);
		let tmpBikeInfo = info.getBikes?.filter(v => v != null).map<typeof bikeInfo[number]>(bike => {
			let dock = info.getDocks?.filter(v => v != null).find(d => d!.code == bike!.parent);
			if (dock == null || !dock.name) console.error('Dock not found', bike, info.getDocks);
			return {
				type: bike!.type == 'electric' ? 'electric' : 'classic',
				id: bike!.name!,
				battery: parseInt(bike!.battery!) ?? null,
				dock: dock!.name!,
				serial: bike!.serialNumber!,
			};
		});
		let tmpDocks = info.getDocks?.filter(v => v != null && v.ledStatus !== 'red')?.length ?? 0;
		let tmpBikes = tmpBikeInfo?.length ?? 0;
		let thisStation = $stations.filter(s => s.serialNumber == stationId);
		if (thisStation[0]) {
			thisStation[0].bikes = tmpBikes;
			thisStation[0].docks = tmpDocks;
		}
		if (tmpBikeInfo && stationId === $selectedStation) {
			bikeInfo = tmpBikeInfo;
			freeDocks = tmpDocks - tmpBikes;
			bikes = tmpBikes;
			$stations = $stations;
		}
		await tick();
		bikeListHeight = bikeList.clientHeight;
		await tick();
		timeout = setTimeout(() => updating = false, 150);
	}
	let backListener:PluginListenerHandle;
	onMount(async () => {
		backListener = await App.addListener('backButton', () => {
			if ($selectedStation != null) {
				dismiss();
			}
		});

		pos.set(dragged.clientHeight, { duration: 0 });
		if ($selectedStation == null) return;
		updateInfo($selectedStation);
	});

	onDestroy(() => {
		backListener.remove();
	});

	$: if ($selectedStation != null) {
		$pos = 0;
		bikeInfo = [];
		updateInfo($selectedStation);
	} else {
		$pos = windowHeight ?? 5000;
	}

	function transition(_: HTMLElement) {
		return {
			duration: 150,
			tick: (_:number) => dismiss(),
		};
	}
</script>

<svelte:window bind:innerHeight={windowHeight} />

<div out:transition bind:this={menu} class="absolute w-full bottom-0 z-10" style:transform="translate(0,{$pos}px)" >
	<div bind:this={dragged} class="bg-background rounded-t-4xl" style:box-shadow="0px 0px 20px 0px var(--color-shadow)">
		<div class="w-full h-6 pt-2" on:touchstart={onTouchStart} on:touchend={onTouchEnd} on:touchmove={onTouchMove}>
			<div class="mx-auto bg-background-tertiary w-16 h-[6px] rounded-full"></div>
		</div>
		<div class="flex p-9 pt-0 pb-2 gap-4" on:touchstart={onTouchStart} on:touchend={onTouchEnd} on:touchmove={onTouchMove}>
			<div class="flex flex-col grow">
				<div class="flex items-center gap-2">
					<span class="font-bold text-sm text-info">Estação {code}</span>
					{#if distance}
						<span transition:fade={{ duration: 150 }} class="font-medium bg-background-secondary text-xs text-info px-1 py-[1px] rounded">{formatDistance(distance)}</span>
					{/if}
				</div>
				<span class="text-xs font-medium text-label leading-none mt-[2px]">{name}</span>
			</div>
			<div class="flex flex-col items-center text-info">
				<span class="font-bold text-2xl leading-none">{bikes}</span>
				<span class="font-bold text-[7px] leading-none">BICICLETAS</span>
			</div>
			<div class="flex flex-col items-center text-info">
				<span class="font-bold text-2xl leading-none">{freeDocks}</span>
				<span class="font-bold text-[7px] text-center leading-none">DOCAS<br>LIVRES</span>
			</div>
		</div>
		<div class="overflow-y-auto transition-all" style:height="calc(min(50vh,{bikeListHeight}px))" on:scroll={() => isScrolling = true} on:touchend={() => isScrolling = false}>
			<div bind:this={bikeList} class="flex flex-col p-5 pt-2 gap-3">
				{#if bikeInfo.length == 0}
					{#each new Array(bikes) as _}
						<Bike disabled={true} />
					{/each}
				{/if}
				{#each bikeInfo as bike}
					<Bike type={bike.type} id={bike.id} battery={bike.battery} dock={bike.dock} serial={bike.serial} disabled={isScrolling} />
				{/each}
				<div class="fixed left-0 w-full h-4 -mt-6" style:box-shadow="0px 6px 6px 0px var(--color-background)" />
			</div>
		</div>
	</div>
</div>