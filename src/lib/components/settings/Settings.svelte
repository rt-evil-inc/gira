<script>

	import { safeInsets, appSettings } from '$lib/stores';
	import Toggle from '../Toggle.svelte';

</script>
<div class="flex flex-col h-screen p-5 gap-8" style:padding-top={$safeInsets.top + 48 + 'px'}>
	<div class="text-3xl font-bold text-info pt-1">Configurações</div>
	<div class="flex flex-col gap-2">

		<div class="flex bg-white rounded-2xl py-4 px-6 gap-5 text-info justify-between" style:box-shadow="0px 0px 12px 0px var(--color-shadow)">
			<div class="grow">
				<div class="font-bold">Limitar desbloqueio</div>
				<div class="text-xs">Restringir distância de desbloqueio de bicicletas a 35m</div>
			</div>
			<Toggle bind:checked={$appSettings.distanceLock} />
		</div>
	</div>
</div>