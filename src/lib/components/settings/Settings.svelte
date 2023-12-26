<script>
	import { LOCK_DISTANCE_m } from '$lib/constants';
	import { appSettings } from '$lib/stores';
	import MenuPage from '../MenuPage.svelte';
	import Toggle from '../Toggle.svelte';
</script>

<MenuPage>
	<div class="flex flex-col p-5 gap-8 grow">
		<div class="text-3xl font-bold text-info pt-1">Configurações</div>
		<div class="flex flex-col gap-2">
			<div class="flex bg-white rounded-2xl py-4 px-5 gap-5 text-info justify-between items-center" style:box-shadow="0px 0px 12px 0px var(--color-shadow)">
				<div class="grow">
					<div class="font-semibold leading-relaxed">Limitar desbloqueio</div>
					<div class="text-xs font-medium leading-[1.1] text-label">Restringir a distância de desbloqueio de bicicletas a {LOCK_DISTANCE_m}m</div>
				</div>
				<Toggle bind:checked={$appSettings.distanceLock} />
			</div>
		</div>
	</div>
</MenuPage>