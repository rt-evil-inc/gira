<script lang="ts">
	import { tweened } from 'svelte/motion';
	import Bike from './Bike.svelte';
	import { cubicOut } from 'svelte/easing';
	import { getStationInfo } from './gira-api';
	import { onMount } from 'svelte';
	import { stations } from './stores';
	import { tick } from 'svelte';

	export let id: string|null = '';
	let initPos = 0;
	let pos = tweened(id != null ? 0 : 9999, { duration: 100, easing: cubicOut });
	let dragged:HTMLDivElement;
	let dismiss = () => {
		pos.set(dragged.clientHeight);
		id = null;
	};
	let name = '', bikes = 0, freeDocks = 0, distance = '', code = '',
		bikeInfo: {type:'electric'|'classic', id:string, battery:number|null, dock:string}[] = [];
	let isScrolling = false;
	let dragging = false;
	let timeout:ReturnType<typeof setTimeout> = setTimeout(() => {}, 0);
	let bikeList:HTMLDivElement;
	export let bikeListHeight = 0;

	function onTouchStart(event: TouchEvent) {
		dragging = true;
		initPos = event.touches[0].clientY - $pos;
		clearTimeout(timeout);
	}
	function onTouchMove(event: TouchEvent) {
		if (dragging) {
			let newPos = Math.max(event.touches[0].clientY - initPos, 0);
			pos.set(newPos, { duration: 0 });
		} else {
			pos.set(0);
		}
	}
	function onTouchEnd() {
		dragging = false;
		if (Math.abs($pos) > dragged.clientHeight * 0.3) {
			dismiss();
		} else {
			pos.set(0);
		}
	}

	onMount(async () => {
		if (id == null) return;
		updateInfo(id);
	});
	async function updateInfo(stationId:string) {
		if ($stations) {
			let station = $stations.find(s => s.serialNumber == id);
			if (station) {
				name = station.name.split('-', 2)[1].trim();
				bikes = station.bikes;
				freeDocks = station.docks - station.bikes;
				code = station.name.split('-', 2)[0].trim();
				//TODO calc
				distance = '1.2km';
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
			};
		});
		if (tmpBikeInfo) bikeInfo = tmpBikeInfo;
		await tick();
		bikeListHeight = bikeList.clientHeight;
		//TODO calc
		distance = '1.2km';
	}

	$: if (id != null) {
		pos.set(0);
		updateInfo(id);
		bikeInfo = [];
	}
</script>

<div bind:this={dragged} class="absolute w-full bottom-0 bg-white rounded-t-4xl z-10" style:transform="translate(0,{$pos}px)" style:box-shadow="0px 0px 20px 0px rgba(0, 0, 0, 0.10)">
	<div class="w-full h-6 pt-2" on:touchstart={onTouchStart} on:touchend={onTouchEnd} on:touchmove={onTouchMove}>
		<div class="mx-auto bg-neutral-200 w-16 h-[6px] rounded-full"></div>
	</div>
	<div class="flex p-9 pt-0 pb-2 gap-4" on:touchstart={onTouchStart} on:touchend={onTouchEnd} on:touchmove={onTouchMove}>
		<div class="flex flex-col grow">
			<div class="flex items-center gap-2">
				<span class="font-bold text-sm text-neutral-500">Estação {code}</span>
				<span class="font-medium bg-neutral-100 text-xs text-neutral-500 px-1 py-[1px] rounded">{distance}</span>
			</div>
			<span class="text-xs font-medium text-neutral-400 leading-none mt-[2px]">{name}</span>
		</div>
		<div class="flex flex-col items-center text-neutral-500">
			<span class="font-bold text-2xl leading-none">{bikes}</span>
			<span class="font-bold text-[7px] leading-none">BICICLETAS</span>
		</div>
		<div class="flex flex-col items-center text-neutral-500">
			<span class="font-bold text-2xl leading-none">{freeDocks}</span>
			<span class="font-bold text-[7px] text-center leading-none">DOCAS<br>LIVRES</span>
		</div>
	</div>
	<div class="overflow-y-auto transition-all" style:height="calc(min(50vh,{bikeListHeight}px))" on:scroll={() => isScrolling = true} on:touchend={() => isScrolling = false} style:box-shadow="0px 60px 40px -40px #FFF inset">
		<div bind:this={bikeList} class="flex flex-col p-5 pt-2 gap-3">
			{#if bikeInfo.length == 0}
				{#each new Array(bikes) as _}
					<Bike disabled={true} />
				{/each}
			{/if}
			{#each bikeInfo as bike}
				<Bike type={bike.type} id={bike.id} battery={bike.battery} dock={bike.dock} disabled={isScrolling} />
			{/each}
			<div class="fixed left-0 w-full h-4 -mt-6" style:box-shadow="0px 6px 6px 0px #FFF" />
		</div>
	</div>
</div>