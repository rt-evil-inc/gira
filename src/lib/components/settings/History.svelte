<script lang="ts">
	import { getTripHistory } from '$lib/gira-api';
	import type { TripHistory_TripDetail } from '$lib/gira-api/types';
	import { onMount } from 'svelte';
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
	function formatDateTime(date:Date) {
		const day = date.getDate();
		const month = date.toLocaleString('pt', { month: 'long' });
		const year = date.getFullYear();
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${day} de ${month} de ${year} às ${hours}:${minutes}`;
	}
	onMount(async () => {
		loadMoreTripHistory();
		const options = {
			rootMargin: '0px',
			threshold: 0.5,
		};
		let observer = new IntersectionObserver(loadMoreTripHistory, options);
		observer.observe(observed);
		console.log(observer);
	});

</script>
<div class="pt-10 flex flex-col h-screen overflow-y-auto">
	<div class="flex flex-col gap-2 p-4">
		{#each trips as trip}
			<div class="flex bg-white rounded-xl px-2 py-1 text-info" style:box-shadow="0px 0px 20px 0px var(--color-shadow)">
				<div>
					<div class="font-bold text-sm">{trip.startLocation}</div>
					<div class="font-medium text-xs">{formatDateTime(new Date(trip.startDate))}</div>
				</div>
			</div>
		{/each}
		<div bind:this={observed}></div>
	</div>
</div>