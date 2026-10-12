<script lang="ts">
	import BikeDetails from '$lib/components/BikeDetails.svelte';
	import type { StationBikeRating } from '$lib/gira-mais-api/types';
	import { t } from '$lib/translations';

	// A bike another rider is bringing to the station: the card of a docked bike, greyed out and without the
	// unlock slider, with how many minutes away it is where the dock number would be.

	interface Props {
		type?: 'classic'|'electric'|null;
		id?: string;
		battery?: number|null;
		rating?: StationBikeRating;
		minutes: number;
	}

	let { type = null, id = '', battery = null, rating = undefined, minutes }: Props = $props();
</script>

<div class="flex items-center w-full min-h-[70px] bg-background rounded-2xl px-5 gap-5 dark:bg-background-secondary" style:box-shadow="0px 0px 12px 0px var(--color-shadow)">
	<BikeDetails {type} {id} {battery} {rating} muted />
	<div class="flex flex-col items-center w-6 text-primary">
		<span class="font-bold text-2xl leading-none">{minutes}</span>
		<span class="font-bold text-[7px] text-center leading-none uppercase">{$t('minutes_label')}</span>
	</div>
</div>