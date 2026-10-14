<script lang="ts">
	import BikeDetails from '$lib/components/BikeDetails.svelte';
	import type { StationBikeRating } from '$lib/gira-mais-api/types';
	import { t } from '$lib/translations';
	import IconClock from '@tabler/icons-svelte/icons/clock';

	// A bike another rider is bringing to the station: the card of a docked bike, greyed out and without the
	// unlock slider. How many minutes away it is goes next to the plate, and there's no dock column, so the time
	// can't be taken for a dock number.

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
	<BikeDetails {type} {id} {battery} {rating} muted>
		{#snippet badge()}
			<span class="flex items-center gap-1 text-primary text-sm font-bold whitespace-nowrap">
				<IconClock size={16} stroke={2.4} />{$t('incoming_bike_minutes', { count: String(minutes) })}
			</span>
		{/snippet}
	</BikeDetails>
</div>