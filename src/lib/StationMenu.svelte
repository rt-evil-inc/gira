<script>
	import Bike from './Bike.svelte';

	export let id = '', name = '', bikes = 0, freeDocks = 0, distance = '';
	let isScrolling = false;
</script>

<div class="absolute bottom-0 w-full bg-white rounded-t-[35px]" style:box-shadow="0px 0px 20px 0px rgba(0, 0, 0, 0.10)">
	<div class="flex p-9 pt-5 pb-2 gap-4">
		<div class="flex flex-col grow">
			<div class="flex items-center gap-2">
				<span class="font-bold text-sm text-[#808080]">Estação {id}</span>
				<span class="font-medium bg-[#F2F2F2] text-xs text-[#808080] px-1 py-[1px] rounded">{distance}</span>
			</div>
			<span class="text-xs font-medium text-[#B0B0B0] leading-none mt-[2px]">{name}</span>
		</div>
		<div class="flex flex-col items-center text-[#808080]">
			<span class="font-bold text-2xl leading-none">{bikes}</span>
			<span class="font-bold text-[7px] leading-none">BICICLETAS</span>
		</div>
		<div class="flex flex-col items-center text-[#808080]">
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