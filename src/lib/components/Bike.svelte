<script lang="ts">
	import { type StationInfo } from '$lib/map.svelte';
	import type { StationBikeRating } from '$lib/gira-mais-api/types';
	import { t } from '$lib/translations';
	import { tryStartTrip } from '$lib/trip';
	import BikeDetails from '$lib/components/BikeDetails.svelte';
	import type { UnlockSubject } from '$lib/unlock-reporting';
	import IconLock from '@tabler/icons-svelte/icons/lock';
	import IconLockOpen from '@tabler/icons-svelte/icons/lock-open';
	import { cubicOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import { fade } from 'svelte/transition';

	interface Props {
		type?: 'classic'|'electric'|null;
		id?: string;
		battery?: number|null;
		dock: string|null;
		rating?: StationBikeRating;
		disabled?: boolean;
		serial: string;
		station: StationInfo;
		unlock?: UnlockSubject;
	}

	let {
		type = null,
		id = '',
		battery = null,
		dock,
		rating = undefined,
		disabled = false,
		serial,
		station,
		unlock = undefined,
	}: Props = $props();
	const action = () => tryStartTrip(id, serial, station, unlock);

	let dragging = false;
	let initPos = 0;
	let pos = new Tween(0, { duration: 100, easing: cubicOut });
	let timeout:ReturnType<typeof setTimeout> = setTimeout(() => {}, 0);
	let slider:HTMLDivElement;
	let moved = false;
	let waiting = $state(false);

	// Bikes the system marks unavailable still unlock; greying them out sets them apart without hiding them.
	let marked = $derived(unlock?.source === 'hidden');
	let accent = $derived(marked ? 'text-label' : 'text-primary');

	function onPointerDown(event: PointerEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		dragging = true;
		// lock to this event
		event.currentTarget.setPointerCapture(event.pointerId);

		initPos = event.clientX - pos.current;
		clearTimeout(timeout);
	}
	function onPointerMove(event: PointerEvent) {
		if (dragging && !disabled) {
			pos.set(event.clientX - initPos, { duration: 0 });
			if (Math.abs(event.clientX - initPos) > 5) {
				moved = true;
			}
		} else {
			pos.set(0);
		}
	}
	function onPointerUp(event: PointerEvent&{currentTarget:EventTarget&HTMLDivElement}) {
		event.currentTarget.releasePointerCapture(event.pointerId);
		dragging = false;
		if (!moved && !disabled) {
			pos.set(50);
			timeout = setTimeout(() => pos.set(0), 150);
		} else {
			pos.set(0);
			if (Math.abs(pos.current) > slider.clientWidth * 0.6) {
				pos.set(pos.current > 0 ? slider.clientWidth : -slider.clientWidth);
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
	<div class="absolute flex {pos.current < 0 ? 'flex-row-reverse' : ''} w-[calc(100%-1px)] h-[calc(100%-1px)] items-center p-4 bg-primary rounded-2xl" style:box-shadow="0px 0px 12px 0px var(--color-shadow)">
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
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="absolute flex items-center bg-background rounded-2xl h-full w-full px-5 gap-5 touch-pan-y dark:bg-background-secondary" style:box-shadow="0px 0px 12px 0px var(--color-shadow)"

		onpointerdown={onPointerDown}
		onpointerup={onPointerUp}
		onpointermove={onPointerMove}
		onpointercancel={onPointerUp}

		style:left="{pos.current}px">
		<BikeDetails {type} {id} {battery} {rating} muted={marked} />
		<div class="flex flex-col items-center w-6 {dock == null ? 'text-label' : accent}">
			<span class="font-bold text-2xl leading-none">{dock ?? '--'}</span>
			<span class="font-bold text-[7px] text-center leading-none">{$t('dock_label')}</span>
		</div>
	</div>
</div>