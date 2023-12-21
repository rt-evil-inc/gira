<script lang="ts">
	import { getTripHistory } from '$lib/gira-api';
	import type { TripHistory_TripDetail } from '$lib/gira-api/types';
	import { onDestroy, onMount } from 'svelte';
	import HistoryItem from './HistoryItem.svelte';
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
			rootMargin: '0px',
			threshold: 0.5,
		};
		observer = new IntersectionObserver(loadMoreTripHistory, options);
		observer.observe(observed);
		console.log(observer);
	});
	onDestroy(() => {
		observer.disconnect();
	});

	$: aggregate = Object.entries(trips.reduce((acc, cur) => {
		if (cur == null) return acc;
		console.log('cur', cur);
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
<div class="pt-12 flex flex-col h-screen">
	<div class="flex flex-col h-full overflow-y-auto">
		<div class="fixed left-0 right-0 h-4 -mt-4" style:box-shadow="0px 6px 6px 0px var(--color-background)" />
		<div class="text-3xl font-bold text-info pl-5 pt-1">Viagens</div>
		{#if didFirstRequest }
			{#if didFirstRequest && trips.length == 0 }
				<div class="flex flex-col items-center justify-center h-full">
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
					<div bind:this={observed}></div>
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
	</div>
</div>