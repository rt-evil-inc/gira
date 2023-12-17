<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { user } from '$lib/stores';
	import IconHistory from '@tabler/icons-svelte/dist/svelte/icons/IconHistory.svelte';
	import IconX from '@tabler/icons-svelte/dist/svelte/icons/IconX.svelte';
	import IconSettings from '@tabler/icons-svelte/dist/svelte/icons/IconSettings.svelte';
	import SettingsEntry from './SettingsEntry.svelte';

	const dispatch = createEventDispatcher();
	let openPage: 'settings' | 'history' | null = null;
</script>

<div
	transition:fade={{ duration: 150 }}
	class="absolute w-full h-full inset-0 bg-neutral-100 z-30 p-4 grid"
>
	{#if openPage === null}
		<div transition:fade={{ duration: 150 }} class="flex flex-col justify-between h-full col-start-1 col-end-2 row-start-1 row-end-2">
			<div>
				<div class="flex items-start justify-between">
					<div class="font-bold text-neutral-800 text-2xl mb-10">
						Boas viagens, <br />{$user?.name}
					</div>
					<div class="flex justify-end">
						<button on:click={() => dispatch('close')}>
							<IconX class="text-neutral-500" size={24} />
						</button>
					</div>
				</div>
				<!-- <div class="flex flex-col items-center justify-center mt-12 mb-10"> -->
				<!--   <div class="relative mb-10"> -->
				<!--     <svg -->
				<!--       class="-m-2" -->
				<!--       width="96" -->
				<!--       height="96" -->
				<!--       viewBox="0 0 192 192" -->
				<!--       fill="none" -->
				<!--       xmlns="http://www.w3.org/2000/svg" -->
				<!--       style:filter="drop-shadow(0px 0px 20px rgba(0, 0, 0, 0.10))" -->
				<!--     > -->
				<!--       <g filter="url(#filter0_d_102_664)"> -->
				<!--         <path -->
				<!--           d="M156.963 119.452C159.69 120.499 161.069 123.568 159.822 126.208C154.644 137.163 146.715 146.628 136.771 153.656C125.384 161.703 111.867 166.193 97.9277 166.558C83.9889 166.923 70.2549 163.147 58.4624 155.706C46.67 148.266 37.3487 137.495 31.6773 124.757C26.0059 112.019 24.2392 97.8854 26.6006 84.1432C28.9619 70.401 35.3452 57.6677 44.9434 47.5534C54.5415 37.439 66.9233 30.398 80.5231 27.3207C92.3994 24.6334 104.739 25.0742 116.344 28.5568C119.141 29.3961 120.499 32.475 119.452 35.2012V35.2012C118.406 37.9275 115.352 39.2649 112.544 38.4627C102.902 35.7079 92.6926 35.4094 82.857 37.635C71.2972 40.2507 60.7726 46.2355 52.6142 54.8327C44.4558 63.4299 39.03 74.2532 37.0228 85.9341C35.0157 97.6149 36.5174 109.629 41.3381 120.456C46.1587 131.283 54.0818 140.438 64.1054 146.763C74.129 153.087 85.8029 156.297 97.6509 155.987C109.499 155.677 120.989 151.86 130.668 145.02C138.903 139.2 145.512 131.413 149.917 122.404C151.2 119.781 154.237 118.406 156.963 119.452V119.452Z" -->
				<!--           fill="#79C000" -->
				<!--         /> -->
				<!--         <path -->
				<!--           d="M127.455 38.8036C128.871 36.2495 132.102 35.3103 134.543 36.9134C145.452 44.0784 154.189 54.1537 159.734 66.0451C165.279 77.9365 167.381 91.1059 165.858 104.068C165.517 106.968 162.721 108.84 159.854 108.283C156.988 107.726 155.14 104.95 155.443 102.046C156.563 91.2828 154.751 80.381 150.15 70.5143C145.549 60.6476 138.363 52.2519 129.398 46.1922C126.978 44.5569 126.04 41.3576 127.455 38.8036Z" -->
				<!--           fill="#79C000" -->
				<!--         /> -->
				<!--         <g filter="url(#filter1_d_102_664)"> -->
				<!--           <circle -->
				<!--             cx="96" -->
				<!--             cy="96" -->
				<!--             r="50" -->
				<!--             class="group-active:fill-neutral-200 fill-neutral-200 transition-colors" -->
				<!--           /> -->
				<!--         </g> -->
				<!--       </g> -->
				<!--     </svg> -->
				<!--     <span -->
				<!--       class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold text-neutral-500" -->
				<!--       >{$user?.name.charAt(0)}</span -->
				<!--     > -->
				<!--   </div> -->
				<!--   <div -->
				<!--     class="rounded-full bg-primary bg-opacity-5 border border-primary px-2 text-primary" -->
				<!--   > -->
				<!--     Subscrito até 21 de Março -->
				<!--   </div> -->
				<!-- </div> -->
				<div class="flex flex-col font-semibold px-2 gap-4">
					<SettingsEntry
						icon={IconHistory}
						text={'Histórico'}
						subtext={'Deslocações e transações'}
						on:click={() => openPage = 'history'}
					/>
					<SettingsEntry
						icon={IconSettings}
						text={'Definições'}
						subtext={'Preferências de bicicletas'}
						on:click={() => openPage = 'settings'}
					/>
				</div>
			</div>
			<div class="flex flex-col px-2 gap-4">
				<div class="flex gap-4 w-full justify-stretch">
					<div
						class="bg-primary w-full bg-opacity-10 text-primary rounded-xl px-4 py-1 text-left text-sm text-opacity-80"
					>
						Distancia percorrida<br />
						<span class="text-opacity-100 text-3xl font-bold"> 279 km </span>
					</div>
					<div
						class="bg-primary w-full bg-opacity-10 text-primary rounded-xl px-4 py-1 text-left text-sm text-opacity-80"
					>
						Total de Viagens<br />
						<span class="text-opacity-100 text-3xl font-bold"> 137 </span>
					</div>
				</div>
				<button
					class="bg-red-100 rounded-xl w-full px-2 py-2 text-red-500 active:bg-red-200 transition-colors"
				>Sair</button
				>
			</div>
		</div>
	{:else if openPage === 'history'}
		<div class="col-start-1 col-end-2 row-start-1 row-end-2">

			<button on:click={() => openPage = null}> go back</button>
		</div>
	{:else if openPage === 'settings'}
		<div class="col-start-1 col-end-2 row-start-1 row-end-2">
			<button on:click={() => openPage = null}> go back</button>
		</div>
	{/if}
</div>