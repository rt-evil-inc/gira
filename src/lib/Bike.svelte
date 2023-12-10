<script lang="ts">
	import { IconBattery, IconBattery1, IconBattery2, IconBattery3, IconBattery4, IconBolt, IconLockOpen, IconSettings } from '@tabler/icons-svelte';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	export let type = 'classical', id = '', battery = 0, dock = 0, disabled = false;
	export let action = () => console.log('unlock');

	let dragging = false;
	let initPos = 0;
	let pos = tweened(0, { duration: 100, easing: cubicOut });
	let timeout:ReturnType<typeof setTimeout> = setTimeout(() => {}, 0);
	let slider:HTMLDivElement;

	function onTouchStart(event: TouchEvent) {
		dragging = true;
		initPos = event.touches[0].clientX - $pos;
		clearTimeout(timeout);
	}
	function onTouchMove(event: TouchEvent) {
		if (dragging && !disabled) {
			pos.set(event.touches[0].clientX - initPos);
		} else {
			pos.set(0);
		}
	}
	function onTouchEnd() {
		dragging = false;
		if ($pos == 0 && !disabled) {
			pos.set(50);
			timeout = setTimeout(() => pos.set(0), 150);
		} else {
			pos.set(0);
			if (Math.abs($pos) > slider.clientWidth * 0.6) {
				action();
			}
		}
	}
</script>

<div bind:this={slider} class="flex items-center justify-center w-full min-h-[70px] relative overflow-hidden rounded-2xl" style:box-shadow="0px 0px 12px 0px rgba(0, 0, 0, 0.10)">
	<div class="absolute flex {$pos < 0 ? 'flex-row-reverse' : ''} w-[calc(100%-1px)] h-[calc(100%-1px)] items-center p-4 bg-primary rounded-2xl" style:box-shadow="0px 0px 12px 0px rgba(0, 0, 0, 0.10)">
		<IconLockOpen size={32} stroke={2} class="text-white" />
	</div>
	<div class="absolute flex items-center bg-white rounded-2xl h-full w-full px-5 gap-5" style:box-shadow="0px 0px 12px 0px rgba(0, 0, 0, 0.10)" on:touchstart={onTouchStart} on:touchend={onTouchEnd} on:touchmove={onTouchMove} style:left="{$pos}px">
		{#if type === 'electric'}
			<IconBolt size={42} stroke={1.7} class="text-primary -mx-3" />
		{:else}
			<IconSettings size={42} stroke={1.7} class="text-primary -mx-3" />
		{/if}
		<span class="text-[15px] font-semibold text-primary">{id}</span>
		<div class="grow" />
		{#if type === 'electric'}
			<div class="flex items-center h-6 px-[6px] bg-primary rounded-md gap-1">
				<span class="text-xs font-semibold text-white">{battery}%</span>
				{#if battery <= 20}
					<IconBattery size={25} stroke={1.7} class="text-white -m-1" />
				{:else if battery <= 40}
					<IconBattery1 size={25} stroke={1.7} class="text-white -m-1" />
				{:else if battery <= 60}
					<IconBattery2 size={25} stroke={1.7} class="text-white -m-1" />
				{:else if battery <= 80}
					<IconBattery3 size={25} stroke={1.7} class="text-white -m-1" />
				{:else}
					<IconBattery4 size={25} stroke={1.7} class="text-white -m-1" />
				{/if}
			</div>
		{/if}
		<div class="flex flex-col items-center text-primary w-6">
			<span class="font-bold text-2xl leading-none">{dock}</span>
			<span class="font-bold text-[7px] text-center leading-none">DOCA</span>
		</div>
	</div>
</div>