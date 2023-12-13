<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import Metric from '$lib/components/Metric.svelte';
	import { cubicInOut } from 'svelte/easing';

	export let destination:boolean, bike:string, time:string, distance:string, speed:string, distanceLeft:string, timeLeft:string, arrivalTime:string;
</script>

<div transition:fly={{ y: -172 }} class="absolute top-0 flex flex-col items-center p-3 gap-2 bg-white w-full transition-all" style:height={destination ? '228px' : '172px'} style:box-shadow="0px 0px 20px 0px rgba(0, 0, 0, 0.10)">
	<span class="font-semibold text-[#B3B3B3] text-lg">{bike}</span>
	<span class="text-5xl text-primary font-bold">{time}</span>
	<div class="absolute top-[104px] transition-all {destination ? 'left-12' : 'left-20'}">
		<Metric value={distance} unit="km" label="Distância Percorrida" />
	</div>
	<div class="absolute top-[104px] transition-all {destination ? 'right-1/2 translate-x-1/2' : 'right-20 translate-x-0'}">
		<Metric value={speed} unit="km/h" label="Velocidade Média" />
	</div>
	{#if destination}
		<div transition:fly={{ x: 64, duration: 150, easing: cubicInOut }} class="absolute top-[104px] transition-all right-12">
			<Metric value={distanceLeft} unit="km" label="Distância em Falta" />
		</div>
		<div transition:fade={{ duration: 150 }}>
			<div class="absolute top-[160px] transition-all left-24">
				<Metric value={timeLeft} unit="min" label="Tempo em Falta" />
			</div>
			<div class="absolute top-[160px] transition-all right-24">
				<Metric value={arrivalTime} label="Hora de Chegada" />
			</div>
		</div>
	{/if}
</div>