<script lang="ts">
	import { getTripHistory } from '$lib/gira-api';
	import type { TripHistory_TripDetail } from '$lib/gira-api/types';
	import { onDestroy, onMount } from 'svelte';
	import HistoryItem from './HistoryItem.svelte';
	let trips:TripHistory_TripDetail[] = [];
	let observed:HTMLDivElement;
	let loading = false;
	function loadMoreTripHistory() {
		if (loading) return;
		loading = true;
		getTripHistory(Math.floor(trips.length / 15), 15).then(res => {
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
		const date = new Date(cur.startDate);
		const key = `${date.getTime()}`;
		if (acc[key] == null) acc[key] = [];
		acc[key].push(cur);
		return acc;
	}, {} as Record<string, TripHistory_TripDetail[]>)).sort((a, b) => {
		const aDate = new Date(a[0]);
		const bDate = new Date(b[0]);
		return bDate.getTime() - aDate.getTime();
	});
	$: console.log(aggregate);

</script>
<div class="pt-12 flex flex-col h-screen">
	<div class="flex flex-col h-full overflow-y-auto">
		<div class="fixed left-0 right-0 h-4 -mt-4" style:box-shadow="0px 6px 6px 0px var(--color-background)" />
		<div class="text-2xl font-bold text-info pl-4 pt-1">Viagens</div>

		<div class="flex flex-col gap-2 p-4">
			{#each aggregate as [dayMs, trips]}
				<div class="flex flex-col gap-2">
					<div class="font-semibold text-label text-sm">{formatDate(new Date(parseInt(dayMs)))}</div>
					{#each trips as trip}
						<HistoryItem trip={trip} />
					{/each}
				</div>
			{/each}
			<div bind:this={observed}></div>
		</div>
	</div>
</div>