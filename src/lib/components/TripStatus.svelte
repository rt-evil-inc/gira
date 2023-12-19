<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import Metric from '$lib/components/Metric.svelte';
	import { cubicInOut } from 'svelte/easing';
	import { currentTrip as t } from '$lib/stores';
	import { onDestroy, onMount } from 'svelte';

	let height:number;
	export { height as posBottom };
	$: if ($t) {
		height = $t.destination ? 228 : 172;
	} else {
		height = 0;
	}

	let seconds = 0;
	let inter: ReturnType<typeof setInterval>;

	onMount(() => {
		seconds = 0;
		inter = setInterval(() => {
			seconds++;
		}, 1000);
	});

	onDestroy(() => {
		clearInterval(inter);
	});

	function msToMinuteSeconds(ms: number) {
		let seconds = Math.floor(ms / 1000);
		let displaySeconds = (seconds % 60).toString().padStart(2, '0');
		let minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
		return `${minutes}:${displaySeconds}`;
	}
</script>

<div transition:fly={{ y: -172 }} class="absolute top-0 flex flex-col items-center p-3 gap-2 bg-background w-full transition-all" style:height="{height}px" style:box-shadow="0px 0px 20px 0px var(--color-shadow)">
	{#key seconds}
		{#if $t != null}
			{@const deltaSeconds = Date.now() - $t.startDate.getTime()}
			<span class="font-semibold text-label text-lg">{$t.bikeId}</span>
			<span class="text-5xl text-primary font-bold">{msToMinuteSeconds(deltaSeconds)}</span>
			<div class="absolute top-[104px] transition-all {$t.destination ? 'left-12' : 'left-20'}">
				<Metric value={$t.distance} unit="km" label="Distância Percorrida" />
			</div>
			<div class="absolute top-[104px] transition-all {$t.destination ? 'right-1/2 translate-x-1/2' : 'right-20 translate-x-0'}">
				<Metric value={$t.speed} unit="km/h" label="Velocidade Média" />
			</div>
			{#if $t.destination}
				<div transition:fly={{ x: 64, duration: 150, easing: cubicInOut }} class="absolute top-[104px] transition-all right-12">
					{#if $t.distanceLeft}
						<Metric value={$t.distanceLeft} unit="km" label="Distância em Falta" />
					{/if}
				</div>
				<div transition:fade={{ duration: 150 }}>
					<div class="absolute top-[160px] transition-all left-24">
						{#if $t.arrivalTime}
							{@const timeLeft = $t.arrivalTime.getTime() - Date.now()}
							<Metric value={msToMinuteSeconds(timeLeft)} unit="min" label="Tempo em Falta" />
						{/if}
					</div>
					<div class="absolute top-[160px] transition-all right-24">
						{#if $t.arrivalTime}
							<Metric value={`${$t.arrivalTime.getHours()}:${$t.arrivalTime.getMinutes()}`} label="Hora de Chegada" />
						{/if}
					</div>
				</div>
			{/if}
		{/if}
	{/key}
</div>