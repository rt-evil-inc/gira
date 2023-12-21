<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { accountInfo, logOut, safeInsets, user } from '$lib/stores';
	import IconHistory from '@tabler/icons-svelte/dist/svelte/icons/IconHistory.svelte';
	import IconX from '@tabler/icons-svelte/dist/svelte/icons/IconX.svelte';
	import IconTool from '@tabler/icons-svelte/dist/svelte/icons/IconTool.svelte';
	import IconInfoCircle from '@tabler/icons-svelte/dist/svelte/icons/IconInfoCircle.svelte';
	import IconArrowLeft from '@tabler/icons-svelte/dist/svelte/icons/IconArrowLeft.svelte';
	import IconTicket from '@tabler/icons-svelte/dist/svelte/icons/IconTicket.svelte';
	import IconLogout2 from '@tabler/icons-svelte/dist/svelte/icons/IconLogout2.svelte';
	import IconMessageReport from '@tabler/icons-svelte/dist/svelte/icons/IconMessageReport.svelte';
	import SettingsEntry from './SettingsEntry.svelte';
	import Metric from './Metric.svelte';
	import History from './settings/History.svelte';
	import Settings from './settings/Settings.svelte';
	import Info from './settings/About.svelte';
	import { App } from '@capacitor/app';
	import type { PluginListenerHandle } from '@capacitor/core';

	const dispatch = createEventDispatcher();
	let openPage: 'settings' | 'history' |'info'| null = null;
	function formatDate(date:Date) {
		// 20 de Março de 2024
		return `${date.getDate()} de ${date.toLocaleString('pt', { month: 'long' })} de ${date.getFullYear()}`;
	}
	let listener:PluginListenerHandle;
	onMount(async () => {
		await App.addListener('backButton', () => {
			if (openPage !== null) openPage = null;
			else dispatch('close');
		});
	});
	onDestroy(async () => {
		if (listener) listener.remove();
	});

</script>

<div transition:fade={{ duration: 150 }} class="absolute w-full h-full inset-0 bg-background z-30 grid" >
	{#if $user}
		<div class="flex flex-col justify-between items-center h-full gap-10 col-start-1 col-end-2 row-start-1 row-end-2 p-4 overflow-x-hidden"
			style:padding-top={($safeInsets.top ? $safeInsets.top : 16) + 'px'}
		>
			<div class="flex flex-col justify-center w-full">
				<div class="flex items-center gap-2 p-4 py-6">
					<div class="relative">
						<svg class="-m-2 w-24 h-24" width="128" height="128" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg" style:filter="drop-shadow(0px 4px 4px var(--color-shadow))" >
							<g filter="url(#filter0_d_102_664)">
								<path
									d="M156.963 119.452C159.69 120.499 161.069 123.568 159.822 126.208C154.644 137.163 146.715 146.628 136.771 153.656C125.384 161.703 111.867 166.193 97.9277 166.558C83.9889 166.923 70.2549 163.147 58.4624 155.706C46.67 148.266 37.3487 137.495 31.6773 124.757C26.0059 112.019 24.2392 97.8854 26.6006 84.1432C28.9619 70.401 35.3452 57.6677 44.9434 47.5534C54.5415 37.439 66.9233 30.398 80.5231 27.3207C92.3994 24.6334 104.739 25.0742 116.344 28.5568C119.141 29.3961 120.499 32.475 119.452 35.2012V35.2012C118.406 37.9275 115.352 39.2649 112.544 38.4627C102.902 35.7079 92.6926 35.4094 82.857 37.635C71.2972 40.2507 60.7726 46.2355 52.6142 54.8327C44.4558 63.4299 39.03 74.2532 37.0228 85.9341C35.0157 97.6149 36.5174 109.629 41.3381 120.456C46.1587 131.283 54.0818 140.438 64.1054 146.763C74.129 153.087 85.8029 156.297 97.6509 155.987C109.499 155.677 120.989 151.86 130.668 145.02C138.903 139.2 145.512 131.413 149.917 122.404C151.2 119.781 154.237 118.406 156.963 119.452V119.452Z"
									fill="#79C000"
								/>
								<path
									d="M127.455 38.8036C128.871 36.2495 132.102 35.3103 134.543 36.9134C145.452 44.0784 154.189 54.1537 159.734 66.0451C165.279 77.9365 167.381 91.1059 165.858 104.068C165.517 106.968 162.721 108.84 159.854 108.283C156.988 107.726 155.14 104.95 155.443 102.046C156.563 91.2828 154.751 80.381 150.15 70.5143C145.549 60.6476 138.363 52.2519 129.398 46.1922C126.978 44.5569 126.04 41.3576 127.455 38.8036Z"
									fill="#79C000"
								/>
								<g filter="url(#filter1_d_102_664)">
									<circle cx="96" cy="96" r="50" class="group-active:fill-background-tertiary fill-background transition-colors" />
								</g>
							</g>
						</svg>
						<span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-semibold text-info">
							{$user?.name.charAt(0)}
						</span>
					</div>
					<div>
						<div class="font-bold text-primary text-xl">
							{$user?.name ? `${$user.name.split(' ').shift()} ${$user.name.split(' ').pop()}` : 'Utilizador'}
						</div>
						<div class="text-xs font-semibold text-label -mt-[2px]">{$user?.email}</div>
					</div>
				</div>
				<div class="flex flex-col items-center gap-6">
					<div class="flex gap-16">
						<Metric value={$accountInfo?.balance ?? 0} unit={'€'} label={'Saldo'} color={'info'} />
						<Metric value={$accountInfo?.bonus ?? 0} unit={''} label={'Bónus'} color={'info'} />
					</div>
					<div>
						<div class="flex items-center gap-1 justify-center">
							<IconTicket size={28} stroke={1.9} class="text-info -my-1" />
							<div class="text-info font-bold text-lg">{$accountInfo?.subscription?.name ?? 'Sem subscrição'}</div>
						</div>
						<div class="text-2xs text-label font-medium text-center -mt-[2px]">{$accountInfo?.subscription?.expirationDate ?
							`Válido até ${formatDate($accountInfo.subscription.expirationDate)}` : ''}</div>
					</div>
				</div>
			</div>
			<div class="flex flex-col grow font-semibold px-2 gap-3 w-full">
				<SettingsEntry icon={IconHistory} text={'Histórico'} subtext={'Lista de viagens anteriores'} on:click={() => openPage = 'history'} />
				<SettingsEntry icon={IconTool} text={'Configurações'} subtext={'Definições da aplicação'} on:click={() => openPage = 'settings'} />
				<a href="https://github.com/ttmx/gira-app/issues"><SettingsEntry icon={IconMessageReport} text={'Feedback'} subtext={'Problemas e sugestões'} /></a>
				<SettingsEntry icon={IconInfoCircle} text={'Sobre'} subtext={'Informação acerca da aplicação'} on:click={() => openPage = 'info'} />
			</div>
			<button class="flex flex-col items-center mb-3" on:click={() => { dispatch('close'); logOut(); }}>
				<IconLogout2 class="text-primary mr-2" size={32} />
				<span class="text-2xs font-medium text-label text-center leading-none max-w-[70px]">SAIR</span>
			</button>
		</div>
		{#if openPage === 'history'}
			<div transition:fade={{ duration: 150 }} class="bg-background col-start-1 col-end-2 row-start-1 row-end-2 z-40">
				<History />
			</div>
		{:else if openPage === 'settings'}
			<div transition:fade={{ duration: 150 }} class="bg-background col-start-1 col-end-2 row-start-1 row-end-2 z-40 ">
				<Settings />
			</div>
		{:else if openPage === 'info'}
			<div transition:fade={{ duration: 150 }} class="bg-background col-start-1 col-end-2 row-start-1 row-end-2 z-40">
				<Info />
			</div>
		{/if}
		<div class="absolute top-0 right-4 flex justify-end z-40" style:margin-top={($safeInsets.top ? $safeInsets.top : 16) + 'px'}>
			<button on:click={() => dispatch('close')}>
				<IconX class="text-info" size={24} />
			</button>
		</div>
		{#if openPage !== null}
			<div transition:fade={{ duration: 150 }} class="absolute top-0 left-4 flex justify-end z-40" style:margin-top={($safeInsets.top ? $safeInsets.top : 16) + 'px'}>
				<button on:click={() => openPage = null}>
					<IconArrowLeft class="text-info" size={24} />
				</button>
			</div>
		{/if}
	{/if}
</div>