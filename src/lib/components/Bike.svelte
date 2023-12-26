<script lang="ts">
	import IconBattery from '@tabler/icons-svelte/dist/svelte/icons/IconBattery.svelte';
	import IconBattery1 from '@tabler/icons-svelte/dist/svelte/icons/IconBattery1.svelte';
	import IconBattery2 from '@tabler/icons-svelte/dist/svelte/icons/IconBattery2.svelte';
	import IconBattery3 from '@tabler/icons-svelte/dist/svelte/icons/IconBattery3.svelte';
	import IconBattery4 from '@tabler/icons-svelte/dist/svelte/icons/IconBattery4.svelte';
	import IconBolt from '@tabler/icons-svelte/dist/svelte/icons/IconBolt.svelte';
	import IconLockOpen from '@tabler/icons-svelte/dist/svelte/icons/IconLockOpen.svelte';
	import IconLock from '@tabler/icons-svelte/dist/svelte/icons/IconLock.svelte';
	import IconSettings from '@tabler/icons-svelte/dist/svelte/icons/IconSettings.svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { reserveBike, startTrip, type ThrownError } from '../gira-api';
	import { accountInfo, addErrorMessage, appSettings, currentTrip, type StationInfo } from '$lib/stores';
	import { currentPos } from '$lib/location';
	import { fade } from 'svelte/transition';
	import { distanceBetweenCoords } from '$lib/utils';
	import { LOCK_DISTANCE_m } from '$lib/constants';

	export let type:'classic'|'electric'|null = null, id:string = '', battery:number|null = null, dock:string, disabled = false, serial:string, station:StationInfo;
	const action = async () => {
		if (serial == null) return;
		try {
			if ($accountInfo?.subscription === null) {
				addErrorMessage('Não tem uma subscrição ativa');
				return false;
			}
			if ($appSettings.distanceLock) {
				if ($currentPos == null) {
					addErrorMessage('Não foi possível determinar a sua posição');
					return false;
				} else {
					if (distanceBetweenCoords($currentPos.coords.latitude, $currentPos.coords.longitude, station.latitude, station.longitude) > LOCK_DISTANCE_m / 1000) {
						addErrorMessage('Não está perto o suficiente da estação selecionada');
						return false;
					}
				}
			}
			let reservedBike = (await reserveBike(serial)).reserveBike;
			if (reservedBike) {
				let success = (await startTrip()).startTrip;
				if (success) {
					$currentTrip = {
						code: '',
						arrivalTime: null,
						bikeId: id,
						travelledDistanceKm: 0,
						destination: null,
						distanceLeft: null,
						speed: 0,
						startDate: new Date,
						startPos: $currentPos ? {
							lng: $currentPos.coords.longitude,
							lat: $currentPos.coords.latitude,
						} : null,
						predictedEndDate: null,
						finished: false,
						pathTaken: $currentPos ? [{
							lng: $currentPos.coords.longitude,
							lat: $currentPos.coords.latitude,
							time: new Date,
						}] : [],
					};
					return true;
				} else {
					addErrorMessage('Não foi possível desbloquear a bicicleta');
					return false;
				}
			}
		} catch (_e) {
			const knownErrors = ['Serviço indisponível. Horário de utilização entre as 06:00 e as 02:00.'];
			const e = _e as ThrownError;
			let addedError = false;
			if (e && e.errors) {
				for (let error of e.errors) {
					if (knownErrors.includes(error.message)) {
						addErrorMessage(error.message);
						addedError = true;
					}
				}
				if (!addedError) {
					addErrorMessage('Não foi possível desbloquear a bicicleta');
				}
			}
			console.error(e);
			return false;
		}
	};

	let dragging = false;
	let initPos = 0;
	let pos = tweened(0, { duration: 100, easing: cubicOut });
	let timeout:ReturnType<typeof setTimeout> = setTimeout(() => {}, 0);
	let slider:HTMLDivElement;
	let moved = false;
	let waiting = false;

	function onTouchStart(event: TouchEvent) {
		dragging = true;
		initPos = event.touches[0].clientX - $pos;
		clearTimeout(timeout);
	}
	function onTouchMove(event: TouchEvent) {
		if (dragging && !disabled) {
			pos.set(event.touches[0].clientX - initPos, { duration: 0 });
			moved = true;
		} else {
			pos.set(0);
		}
	}
	function onTouchEnd() {
		dragging = false;
		if ($pos == 0 && !moved && !disabled) {
			pos.set(50);
			timeout = setTimeout(() => pos.set(0), 150);
		} else {
			pos.set(0);
			if (Math.abs($pos) > slider.clientWidth * 0.6) {
				pos.set($pos > 0 ? slider.clientWidth : -slider.clientWidth);
				waiting = true;
				action().then(success => {
					waiting = false;
					if (!success) pos.set(0);
				});
			}
		}
		moved = false;
	}
</script>

<div bind:this={slider} class="flex items-center justify-center w-full min-h-[70px] relative overflow-hidden rounded-2xl" style:box-shadow="0px 0px 12px 0px var(--color-shadow)" >
	<div class="absolute flex {$pos < 0 ? 'flex-row-reverse' : ''} w-[calc(100%-1px)] h-[calc(100%-1px)] items-center p-4 bg-primary rounded-2xl" style:box-shadow="0px 0px 12px 0px var(--color-shadow)">
		{#if !waiting}
			<div transition:fade={{ duration: 150 }}>
				<IconLockOpen size={32} stroke={2} class="text-background" />
			</div>
		{:else}
			<div class="absolute left-1/2 -translate-x-1/2" transition:fade={{ duration: 150, delay: 150 }}>
				<IconLock size={32} stroke={2} class="text-background animate-bounce" />
			</div>
		{/if}
	</div>
	<div class="absolute flex items-center bg-background rounded-2xl h-full w-full px-5 gap-5" style:box-shadow="0px 0px 12px 0px var(--color-shadow)" on:touchstart={onTouchStart} on:touchend={onTouchEnd} on:touchmove={onTouchMove} style:left="{$pos}px">
		{#if type === 'electric'}
			<IconBolt size={42} stroke={1.7} class="text-primary -mx-3" />
		{:else}
			<IconSettings size={42} stroke={1.7} class="text-primary -mx-3" />
		{/if}
		<span class="text-[15px] font-bold text-primary">{id}</span>
		<div class="grow" />
		{#if type === 'electric' && battery != null}
			<div class="flex items-center h-6 px-[6px] bg-primary rounded-md gap-1">
				<span class="text-xs font-bold text-background">{battery}%</span>
				{#if battery <= 20}
					<IconBattery size={25} stroke={1.7} class="text-background -m-1" />
				{:else if battery <= 40}
					<IconBattery1 size={25} stroke={1.7} class="text-background -m-1" />
				{:else if battery <= 60}
					<IconBattery2 size={25} stroke={1.7} class="text-background -m-1" />
				{:else if battery <= 80}
					<IconBattery3 size={25} stroke={1.7} class="text-background -m-1" />
				{:else}
					<IconBattery4 size={25} stroke={1.7} class="text-background -m-1" />
				{/if}
			</div>
		{/if}
		<div class="flex flex-col items-center text-primary w-6">
			<span class="font-bold text-2xl leading-none">{dock}</span>
			<span class="font-bold text-[7px] text-center leading-none">DOCA</span>
		</div>
	</div>
</div>