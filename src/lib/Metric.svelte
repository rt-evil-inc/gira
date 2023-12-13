<script lang="ts">
	export let value:number|string, unit:string = '', label:string;
</script>

<div class="flex flex-col items-center">
	<div>
		<span class="text-2xl font-bold -mr-[3px] text-primary">{value}</span>
		<span class="text-sm font-semibold text-[#B3B3B3]">{unit}</span>
	</div>
	<span class="text-[9px] font-medium text-[#B3B3B3] text-center -mt-1 leading-none max-w-[70px]">{label.toUpperCase()}</span>
</div>