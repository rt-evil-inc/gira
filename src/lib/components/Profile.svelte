<script lang="ts">
	import IconHistory from '@tabler/icons-svelte/icons/history';
	import IconX from '@tabler/icons-svelte/icons/x';
	import IconTool from '@tabler/icons-svelte/icons/tool';
	import IconInfoCircle from '@tabler/icons-svelte/icons/info-circle';
	import IconArrowLeft from '@tabler/icons-svelte/icons/arrow-left';
	import IconTicket from '@tabler/icons-svelte/icons/ticket';
	import IconLogout2 from '@tabler/icons-svelte/icons/logout-2';
	import IconMessageReport from '@tabler/icons-svelte/icons/message-report';
	import { createEventDispatcher, onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { safeInsets } from '$lib/ui';
	import ProfileMenuEntry from '$lib/components/ProfileMenuEntry.svelte';
	import Metric from '$lib/components/Metric.svelte';
	import History from '$lib/components/settings/History.svelte';
	import Settings from '$lib/components/settings/Settings.svelte';
	import Info from '$lib/components/settings/About.svelte';
	import { App } from '@capacitor/app';
	import type { PluginListenerHandle } from '@capacitor/core';
	import { user, accountInfo, logOut } from '$lib/account';
	import { IconHeart } from '@tabler/icons-svelte';

	let openPage: 'settings' | 'history' |'info'| null = null;
	let backListener: PluginListenerHandle;
	const dispatch = createEventDispatcher();

	function formatDate(date:Date) {
		// 20 de Março de 2024
		return `${date.getDate()} de ${date.toLocaleString('pt', { month: 'long' })} de ${date.getFullYear()}`;
	}

	onMount(() => {
		App.addListener('backButton', () => {
			if (openPage !== null) openPage = null;
			else dispatch('close');
		}).then(l => backListener = l);

		return () => backListener?.remove();
	});

</script>

<div transition:fly={{ duration: 150, x: 100 }} class="absolute w-full h-full inset-0 bg-background z-30 grid" >
	{#if $user}
		<div class="flex flex-col justify-between items-center h-full gap-10 col-start-1 col-end-2 row-start-1 row-end-2 p-4 overflow-x-hidden"
			style:padding-top="{Math.max($safeInsets.top, 16)}px" style:padding-bottom="{Math.max($safeInsets.bottom, 24)}px"
		>
			<div class="flex flex-col justify-center items-center w-full gap-6 mt-9">
				<div class="flex flex-col items-center">
					<div class="font-bold text-primary text-3xl text-center leading-none">
						{$user?.name ? `${$user.name.split(' ').shift()} ${$user.name.split(' ').pop()}` : 'Utilizador'}
					</div>
					<div class="text-sm font-medium text-label">{$user?.email}</div>
				</div>
				<div class="flex gap-16">
					<Metric value={$accountInfo?.balance?.toFixed(2) ?? '0.00'} unit={'€'} label={'Saldo'} color={($accountInfo?.balance ?? 0) < 0 ? 'warning' : 'info'} />
					<Metric value={$accountInfo?.bonus ?? 0} unit={''} label={'Pontos'} color={'info'} />
				</div>
				<div>
					<div class="flex items-center gap-1 justify-center">
						<IconTicket size={28} stroke={1.9} class="text-info -my-1" />
						<div class="text-info font-bold text-lg">{$accountInfo?.subscription?.name ?? 'Sem subscrição'}</div>
					</div>
					<div class="text-xs text-label font-medium text-center -mt-[2px]">{$accountInfo?.subscription?.expirationDate ?
						`Válido até ${formatDate($accountInfo.subscription.expirationDate)}` : ''}</div>
				</div>
			</div>
			<div class="flex flex-col grow font-semibold px-2 gap-3 w-full">
				<ProfileMenuEntry icon={IconHistory} text={'Histórico'} subtext={'Lista de viagens anteriores'} on:click={() => openPage = 'history'} />
				<ProfileMenuEntry icon={IconTool} text={'Configurações'} subtext={'Definições da aplicação'} on:click={() => openPage = 'settings'} />
				<a href="https://github.com/rt-evil-inc/gira/issues"><ProfileMenuEntry icon={IconMessageReport} text={'Feedback'} subtext={'Problemas e sugestões'} external /></a>
				<ProfileMenuEntry icon={IconInfoCircle} text={'Sobre'} subtext={'Informação acerca da aplicação'} on:click={() => openPage = 'info'} />
				<a href="https://github.com/sponsors/rt-evil-inc/"><ProfileMenuEntry icon={IconHeart} iconClass="stroke-[#db61a2]" text={'Contribuir'} subtext={'Apoiar o desenvolvimento do projeto'} external /></a>
			</div>
			<button class="flex flex-col items-center mb-3" on:click={() => { dispatch('close'); logOut(); }}>
				<IconLogout2 class="text-primary mr-2" size={32} />
				<span class="text-2xs font-semibold text-label text-center leading-none max-w-[70px]">SAIR</span>
			</button>
		</div>
		{#if openPage === 'history'}
			<History />
		{:else if openPage === 'settings'}
			<Settings />
		{:else if openPage === 'info'}
			<Info />
		{/if}
		<div class="absolute top-2 right-6 flex justify-end z-40" style:margin-top="{Math.max($safeInsets.top, 16)}px">
			<button on:click={() => dispatch('close')}>
				<IconX class="text-info" size={24} />
			</button>
		</div>
		{#if openPage !== null}
			<div transition:fade={{ duration: 150 }} class="absolute top-2 left-6 flex justify-end z-40" style:margin-top="{Math.max($safeInsets.top, 16)}px">
				<button on:click={() => openPage = null}>
					<IconArrowLeft class="text-info" size={24} />
				</button>
			</div>
		{/if}
	{/if}
</div>