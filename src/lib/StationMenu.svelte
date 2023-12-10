<script lang="ts">
	import { tweened } from 'svelte/motion';
	import Bike from './Bike.svelte';
	import { cubicOut } from 'svelte/easing';

	let initPos = 0;
	let pos = tweened(0, { duration: 100, easing: cubicOut });
	let dragged:HTMLDivElement;
	let action = () => {
		console.log('unlock');
		pos.set(dragged.clientHeight);
	};
	export let id = '', name = '', bikes = 0, freeDocks = 0, distance = '';
	let isScrolling = false;
	let dragging = false;
	let moved = false;
	let timeout:ReturnType<typeof setTimeout> = setTimeout(() => {}, 0);

	function onTouchStart(event: TouchEvent) {
		dragging = true;
		initPos = event.touches[0].clientY - $pos;
		clearTimeout(timeout);
	}
	function onTouchMove(event: TouchEvent) {
		if (dragging) {
			let newPos = Math.max(event.touches[0].clientY - initPos, 0);
			pos.set(newPos, { duration: 0 });
			if (newPos != 0) moved = true;
		} else {
			pos.set(0);
		}
	}
	function onTouchEnd() {
		dragging = false;
		if ($pos == 0 && !moved) {
			pos.set(50);
			timeout = setTimeout(() => pos.set(0), 150);
		} else {
			if (Math.abs($pos) > dragged.clientHeight * 0.6) {
				action();
			} else {
				pos.set(0);
			}
		}
		moved = false;
	}
</script>

<div bind:this={dragged} class="absolute w-full bottom-0 bg-white rounded-t-4xl z-10 translate-x-32" style:transform="translate(0,{$pos}px)" style:box-shadow="0px 0px 20px 0px rgba(0, 0, 0, 0.10)">
	<div class="w-full h-6 pt-2" on:touchstart={onTouchStart} on:touchend={onTouchEnd} on:touchmove={onTouchMove}>
		<div class="mx-auto bg-gray-200 w-20 h-2 pb-2 rounded-full"></div>
	</div>
	<div class="flex p-9 pt-0 pb-2 gap-4" on:touchstart={onTouchStart} on:touchend={onTouchEnd} on:touchmove={onTouchMove}>
		<div class="flex flex-col grow">
			<div class="flex items-center gap-2">
				<span class="font-bold text-sm text-neutral-500">Estação {id}</span>
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
	<div class="flex flex-col p-5 pt-2 gap-3 max-h-[50vh] overflow-y-auto" on:scroll={() => isScrolling = true} on:touchend={() => isScrolling = false} style:box-shadow="0px 60px 40px -40px #FFF inset">
		<Bike type="electric" id="E1203" battery={75} dock={2} disabled={isScrolling} />
		<Bike type="classical" id="C0171" dock={7} disabled={isScrolling} />
		<Bike type="electric" id="E1869" battery={70} dock={9} disabled={isScrolling} />
		<Bike type="electric" id="E0302" battery={80} dock={12} disabled={isScrolling} />
		<Bike type="classical" id="C0352" dock={14} disabled={isScrolling} />
		<Bike type="electric" id="E1203" battery={75} dock={2} disabled={isScrolling} />
		<Bike type="classical" id="C0171" dock={7} disabled={isScrolling} />
		<Bike type="electric" id="E1869" battery={70} dock={9} disabled={isScrolling} />
		<Bike type="electric" id="E0302" battery={80} dock={12} disabled={isScrolling} />
		<Bike type="classical" id="C0352" dock={14} disabled={isScrolling} />
		<div class="fixed left-0 w-full h-4 -mt-6" style:box-shadow="0px 6px 6px 0px #FFF" />
	</div>
</div>