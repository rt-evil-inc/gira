<script lang="ts">
	import { getTripHistory } from '$lib/gira-api';
	import type { TripHistory_TripDetail } from '$lib/gira-api/types';
	import { onDestroy, onMount } from 'svelte';
	import HistoryItem from './HistoryItem.svelte';
	import { safeInsets } from '$lib/stores';
	import { fade } from 'svelte/transition';
	let trips:TripHistory_TripDetail[] = [];
	let observed:HTMLDivElement;
	let didFirstRequest = false;
	let loading = false;
	function loadMoreTripHistory() {
		if (loading) return;
		loading = true;
		getTripHistory(Math.floor(trips.length / 15), 15).then(res => {
			didFirstRequest = true;
			if (res.tripHistory == null) return;
			trips = trips.concat(res.tripHistory.reduce((acc, cur) => {
				if (cur != null) acc.push(cur);
				return acc;
			}, [] as TripHistory_TripDetail[]));
			loading = false;
		});
	}
	function formatDate(date:Date) {
		const day = date.getDate();
		const month = date.toLocaleString('pt', { month: 'short' });
		const year = date.getFullYear();
		const dayOfWeek = date.toLocaleString('pt', { weekday: 'long' });
		return `${dayOfWeek}, ${day} ${month} ${year}`;
	}
	let observer:IntersectionObserver;
	onMount(async () => {
		loadMoreTripHistory();
		const options = {
			rootMargin: '128px',
			threshold: 0.1,
		};
		function loadMoreTripHistoryProxy(entries:IntersectionObserverEntry[]) {
			console.log(entries);
			if (entries[0].isIntersecting) loadMoreTripHistory();
		}
		observer = new IntersectionObserver(loadMoreTripHistoryProxy, options);
		observer.observe(observed);
	});
	onDestroy(() => {
		observer.disconnect();
	});

	$: aggregate = Object.entries(trips.reduce((acc, cur) => {
		if (cur == null) return acc;
		const date = new Date(cur.startDate);
		const key = `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`;
		if (acc[key] == null) acc[key] = [date.getTime(), []];
		acc[key][1].push(cur);
		return acc;
	}, {} as Record<string, [number, TripHistory_TripDetail[]]>)).sort((a, b) => {
		const aDate = new Date(a[0]);
		const bDate = new Date(b[0]);
		return bDate.getTime() - aDate.getTime();
	});
	$: console.log(aggregate);

</script>
<div class="flex flex-col h-screen" style:padding-top={$safeInsets.top + 48 + 'px'}>
	<div class="flex flex-col h-full overflow-y-auto">
		<div class="fixed left-0 right-0 h-4 -mt-4" style:box-shadow="0px 6px 6px 0px var(--color-background)" />
		<div class="text-3xl font-bold text-info pl-5 pt-1">Viagens</div>
		{#if didFirstRequest }
			{#if didFirstRequest && trips.length == 0 }
				<div class="flex flex-col items-center justify-center h-full" style:margin-top={-$safeInsets.top - 32 + 'px'}>
					<div class="text-2xl font-bold text-info">Nenhuma viagem</div>
					<div class="text-label text-sm text-center">Não há viagens registadas</div>
				</div>
			{:else}
				<div class="flex flex-col gap-6 p-5">
					{#each aggregate as [_, tripsObj]}
						<div class="flex flex-col gap-3">
							<div class="font-semibold text-label text-sm">{formatDate(new Date(tripsObj[0]))}</div>
							{#each tripsObj[1] as trip}
								<HistoryItem trip={trip} />
							{/each}
						</div>
					{/each}
				</div>
			{/if}
		{:else}
			<div class="flex flex-col gap-6 p-5">
				{#each new Array(4).fill(0) as _}
					<div class="flex flex-col gap-3">
						<div class="font-semibold text-label text-sm h-4 bg-neutral-100 rounded-xl animate-pulse"
							style:width={(Math.random() * 15 + 40) + '%'}
						></div>
						{#each new Array(Math.floor(Math.random() * 3 + 1)).fill(0) as _}
							<HistoryItem trip={null} />
						{/each}
					</div>
				{/each}
			</div>
		{/if}
		<div class="mx-auto"
			class:hidden={trips.length == 0}
			style:padding-bottom={$safeInsets.bottom + 'px'}
			bind:this={observed}>
			<svg out:fade={{ duration: 500 }} class="w-20 h-12 mb-4" width="57" height="38" viewBox="0 0 57 38" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M10.7469 26.7097L17.5402 20.9704C15.053 17.2971 9.84124 18.363 7.58001 18.8319C12.618 19.852 10.7469 26.7097 10.7469 26.7097Z" fill="#79C000"/>
				<path d="M10.7469 26.7097L19.5439 26.8765C19.2379 24.317 18.5054 22.3959 17.5402 20.9704L10.7469 26.7097Z" fill="#79C000"/>
				<path d="M26.0602 27L22.0853 17.1306M26.0602 27L38.7343 10.418M26.0602 27L19.5439 26.8765M18.5339 8.42235H15.7319M18.5339 8.42235H22.4436M18.5339 8.42235L22.0853 17.1306M10.7469 26.7097C10.7469 26.7097 12.618 19.852 7.58001 18.8319M10.7469 26.7097L19.5439 26.8765M10.7469 26.7097L17.5402 20.9704M22.0853 17.1306L17.5402 20.9704M46 26.7097L42.7419 22.1379L38.7343 10.418M38.7343 10.418L37.1379 5.12046L41.015 2L34.4988 2.39913M7.58001 18.8319C9.84124 18.363 15.053 17.2971 17.5402 20.9704M7.58001 18.8319H3M19.5439 26.8765C19.2379 24.317 18.5054 22.3959 17.5402 20.9704" stroke="#79C000" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
				<g class="animate-spin origin-[10.9197px_26.9197px]">
					<circle cx="10.9197" cy="26.9197" r="8.91971" stroke="#79C000" stroke-width="4"/>
					<path d="M2 27H20" stroke="#79C000"/>
					<path d="M6.5 34.7939L15.5 19.2055" stroke="#79C000"/>
					<path d="M15.5 34.7939L6.5 19.2055" stroke="#79C000"/>
				</g>
				<g class="animate-spin origin-[45.9197px_26.9197px]">
					<circle cx="45.9197" cy="26.9197" r="8.91971" stroke="#79C000" stroke-width="4"/>
					<path d="M37 27H55" stroke="#79C000"/>
					<path d="M41.5 34.7939L50.5 19.2055" stroke="#79C000"/>
					<path d="M50.5 34.7939L41.5 19.2055" stroke="#79C000"/>
				</g>
			</svg>
		</div>
	</div>
</div>