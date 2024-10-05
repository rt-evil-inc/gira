<script>
	import { dev } from '$app/environment';
	import { LOCK_DISTANCE_m } from '$lib/constants';
	import { appSettings } from '$lib/settings';
	import MenuPage from '$lib/components/MenuPage.svelte';
	import Toggle from '$lib/components/Toggle.svelte';
</script>

<MenuPage>
	<div class="flex flex-col p-5 gap-8 grow">
		<div class="text-3xl font-bold text-info pt-1">Configurações</div>
		<div class="flex flex-col gap-2">
			<div class="flex bg-background rounded-2xl py-4 px-5 gap-5 text-info justify-between items-center dark:bg-background-secondary" style:box-shadow="0px 0px 12px 0px var(--color-shadow)">
				<div class="grow">
					<div class="font-semibold leading-relaxed">Tema</div>
					<div class="text-xs font-medium leading-[1.1] text-label">Esquema de cores da aplicação</div>
				</div>
				<select bind:value={$appSettings.theme} class="bg-background-secondary dark:bg-background-tertiary rounded-xl border-none focus:ring-0 text-sm">
					<option value="system">Sistema</option>
					<option value="light">Claro</option>
					<option value="dark">Escuro</option>
				</select>
			</div>
			<div class="flex bg-background rounded-2xl py-4 px-5 gap-5 text-info justify-between items-center dark:bg-background-secondary" style:box-shadow="0px 0px 12px 0px var(--color-shadow)">
				<div class="grow">
					<div class="font-semibold leading-relaxed">Limitar desbloqueio</div>
					<div class="text-xs font-medium leading-[1.1] text-label">Restringir a distância de desbloqueio de bicicletas a {LOCK_DISTANCE_m} metros</div>
				</div>
				<Toggle bind:checked={$appSettings.distanceLock} />
			</div>
			<div class="flex bg-background rounded-2xl py-4 px-5 gap-5 text-info justify-between items-center dark:bg-background-secondary" style:box-shadow="0px 0px 12px 0px var(--color-shadow)">
				<div class="grow">
					<div class="font-semibold leading-relaxed">Localização em segundo plano</div>
					<div class="text-xs font-medium leading-[1.1] text-label">Continuar a atualizar a localização enquanto o dispositivo está bloqueado ou a aplicação está em segundo plano</div>
				</div>
				<Toggle bind:checked={$appSettings.backgroundLocation} />
			</div>
			<div class="flex bg-background rounded-2xl py-4 px-5 gap-5 text-info justify-between items-center dark:bg-background-secondary" style:box-shadow="0px 0px 12px 0px var(--color-shadow)">
				<div class="grow">
					<div class="font-semibold leading-relaxed">Contribuir para estatísticas</div>
					<div class="text-xs font-medium leading-[1.1] text-label">Contribuir com a coleção de eventos anónimos: abertura da aplicação e começo de viagens</div>
				</div>
				<Toggle bind:checked={$appSettings.analytics} />
			</div>
			{#if dev}
				<div class="flex bg-background rounded-2xl py-4 px-5 gap-5 text-info justify-between items-center dark:bg-background-secondary" style:box-shadow="0px 0px 12px 0px var(--color-shadow)">
					<div class="grow">
						<div class="font-semibold leading-relaxed">Simular desbloqueio</div>
						<div class="text-xs font-medium leading-[1.1] text-label">Simular a reserva e desbloqueio de bicicletas em modo de desenvolvimento</div>
					</div>
					<Toggle bind:checked={$appSettings.mockUnlock} />
				</div>
			{/if}
		</div>
	</div>
</MenuPage>