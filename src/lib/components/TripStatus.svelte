<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import Metric from '$lib/components/Metric.svelte';
	import { cubicInOut } from 'svelte/easing';
	import { currentTrip as t } from '$lib/stores';
	import { onDestroy, onMount } from 'svelte';
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
</script>

{#key seconds}
	{#if $t != null}
		{@const deltaSeconds = Math.floor((Date.now() - $t.startDate.getTime()) / 1000)}
		<div transition:fly={{ y: -172 }} class="absolute top-0 flex flex-col items-center p-3 gap-2 bg-white w-full transition-all" style:height={$t.destination ? '228px' : '172px'} style:box-shadow="0px 0px 20px 0px rgba(0, 0, 0, 0.10)">
			<span class="font-semibold text-[#B3B3B3] text-lg">{$t.bikeId}</span>
			<span class="text-5xl text-primary font-bold">{Math.floor(deltaSeconds / 60)}:{Math.floor(deltaSeconds % 60)}</span>
			<div class="absolute top-[104px] transition-all {$t.destination ? 'left-12' : 'left-20'}">
				{#if $t.distance}
					<Metric value={$t.distance} unit="km" label="Distância Percorrida" />
				{/if}
			</div>
			<div class="absolute top-[104px] transition-all {$t.destination ? 'right-1/2 translate-x-1/2' : 'right-20 translate-x-0'}">
				{#if $t.speed}
					<Metric value={$t.speed} unit="km/h" label="Velocidade Média" />
				{/if}
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
							{@const timeLeft = Math.floor(($t.arrivalTime.getTime() - Date.now()) / 1000)}
							<Metric value={`${Math.floor(timeLeft / 60)}:${Math.floor(timeLeft % 60)}`} unit="min" label="Tempo em Falta" />
						{/if}
					</div>
					<div class="absolute top-[160px] transition-all right-24">
						{#if $t.arrivalTime}
							<Metric value={`${$t.arrivalTime.getHours()}:${$t.arrivalTime.getMinutes()}`} label="Hora de Chegada" />
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
{/key}