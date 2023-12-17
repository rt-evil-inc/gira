<script lang="ts">
	export let value:number|string, unit:string = '', label:string, color:string = 'primary';
</script>

<div class="flex flex-col items-center">
	<div class="flex">
		<slot name="label-icon" />
		<span class="text-2xl font-bold text-{color} pr-px">{value}</span><span class="text-sm font-semibold text-[#B3B3B3]">
			{unit}</span>
	</div>
	<span class="text-xxs font-medium text-[#B3B3B3] text-center -mt-1 leading-none max-w-[70px]">{label.toUpperCase()}</span>
</div>