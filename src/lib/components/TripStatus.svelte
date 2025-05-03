<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import Metric from '$lib/components/Metric.svelte';
	import { cubicInOut } from 'svelte/easing';
	import { currentTrip as t } from '$lib/trip';
	import { onMount } from 'svelte';
	import { KeepAwake } from '@capacitor-community/keep-awake';
	import { ScreenOrientation } from '@capacitor/screen-orientation';
	import { following } from '$lib/map';
	import { safeInsets } from '$lib/ui';

	export let height:number;
	export let width:number;
	export let lockOrientation = false;

	let portrait = true;
	$: if ($t) {
		height = portrait ? ($t.destination ? 216 : 160) + Math.max(12, $safeInsets.top) : 0;
		width = portrait ? 0 : ($t.destination ? 238 : 190) + $safeInsets.top;
		lockOrientation = false;
	} else {
		height = 0;
		width = 0;
		lockOrientation = true;
	}

	$: if (lockOrientation) {
		ScreenOrientation.lock({ orientation: 'portrait' });
	} else {
		ScreenOrientation.unlock();
	}

	let seconds: number;
	let inter: ReturnType<typeof setInterval>;

	onMount(() => {
		seconds = 0;
		inter = setInterval(() => seconds++, 1000);
		$following = true;
		KeepAwake.keepAwake();
		ScreenOrientation.orientation().then(o => portrait = o.type === 'portrait-primary');
		ScreenOrientation.addListener('screenOrientationChange', o => portrait = o.type === 'portrait-primary');
		return () => {
			clearInterval(inter);
			KeepAwake.allowSleep();
			ScreenOrientation.removeAllListeners();
		};
	});

	function msToMinuteSeconds(ms: number) {
		let seconds = Math.floor(ms / 1000);
		let displaySeconds = (seconds % 60).toString().padStart(2, '0');
		let minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
		return `${minutes}:${displaySeconds}`;
	}

	function formatTime(date: Date) {
		return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
	}
</script>

<div transition:fly={portrait ? { y: -172 } : { x: -172 }} class="absolute bg-background top-0 left-0 transition-all" style:height={portrait ? `${height}px` : '100%'} style:width={portrait ? '100%' : `${width}px`} style:box-shadow="0px 0px 20px 0px var(--color-shadow)">
	{#if $t != null}
		{@const deltaSeconds = Date.now() - $t.startDate.getTime()}
		<div class="flex flex-col items-center gap-2 relative {$t.destination ? 'h-64' : 'h-52'} {portrait ? '' : 'top-1/2 -translate-y-1/2'}" style={`margin-${portrait ? 'top' : 'left'}: ${portrait ? Math.max(12, $safeInsets.top) : $safeInsets.top}px`}>
			{#if $t.bikePlate}
				<span class="font-semibold text-label text-lg">{$t.bikePlate}</span>
			{/if}
			<span class="text-5xl text-primary font-bold">{msToMinuteSeconds(deltaSeconds) ?? seconds}</span> <!-- Using `seconds` variable to force an update every second -->
			<div class="absolute top-[92px] transition-all {portrait ? $t.destination ? 'left-12' : 'left-20' : $t.destination ? 'left-4' : 'right-1/2 translate-x-1/2'}">
				<Metric value={$t.traveledDistanceKm >= 1 ? $t.traveledDistanceKm : Math.round($t.traveledDistanceKm * 1000)} unit={$t.traveledDistanceKm >= 1 ? 'km' : 'm'} label="Distância Percorrida" />
			</div>
			<div class="absolute transition-all {portrait ? $t.destination ? 'top-[92px] right-1/2 translate-x-1/2' : 'top-[92px] right-20 translate-x-0' : $t.destination ? 'top-[92px] right-4' : 'top-[150px] right-1/2 translate-x-1/2'}">
				<Metric value={$t.speed <= 0 ? '--' : $t.speed} unit="km/h" label="Velocidade Média" />
			</div>
			{#if $t.destination}
				<div transition:fly={{ x: 64, duration: 150, easing: cubicInOut }} class="absolute transition-all {portrait ? 'top-[92px] right-12' : 'top-[150px] left-4'}">
					{#if $t.distanceLeft != null}
						<Metric value={$t.distanceLeft} unit="km" label="Distância em Falta" />
					{/if}
				</div>
				<div transition:fade={{ duration: 150 }}>
					<div class="absolute top-[150px] transition-all {portrait ? 'left-24' : 'right-4'}">
						{#if $t.arrivalTime}
							{@const timeLeft = $t.arrivalTime.getTime() - Date.now()}
							<Metric value={msToMinuteSeconds(timeLeft)} unit="min" label="Tempo em Falta" />
						{/if}
					</div>
					<div class="absolute transition-all {portrait ? 'top-[150px] right-24' : 'top-[208px] right-1/2 translate-x-1/2'}">
						{#if $t.arrivalTime}
							<Metric value={formatTime($t.arrivalTime)} label="Hora de Chegada" />
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>