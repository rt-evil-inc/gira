<script lang="ts">
	import type { StationBikeRating } from '$lib/gira-mais-api/types';
	import { t } from '$lib/translations';
	import IconBattery from '@tabler/icons-svelte/icons/battery';
	import IconBattery1 from '@tabler/icons-svelte/icons/battery-1';
	import IconBattery2 from '@tabler/icons-svelte/icons/battery-2';
	import IconBattery3 from '@tabler/icons-svelte/icons/battery-3';
	import IconBattery4 from '@tabler/icons-svelte/icons/battery-4';
	import IconBolt from '@tabler/icons-svelte/icons/bolt';
	import IconMoodConfuzed from '@tabler/icons-svelte/icons/mood-confuzed';
	import IconMoodEmpty from '@tabler/icons-svelte/icons/mood-empty';
	import IconMoodHappy from '@tabler/icons-svelte/icons/mood-happy';
	import IconMoodSmile from '@tabler/icons-svelte/icons/mood-smile';
	import IconMoodWrrr from '@tabler/icons-svelte/icons/mood-wrrr';
	import IconSettings from '@tabler/icons-svelte/icons/settings';
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';

	// A bike card's face: its type, plate, rating and battery, laid out as items of the card's row.

	interface Props {
		type?: 'classic'|'electric'|null;
		id?: string;
		battery?: number|null;
		rating?: StationBikeRating;
		/** Grey instead of the accent colour, for bikes that stand apart from the unlockable ones. */
		muted?: boolean;
		/** Shown after the plate. */
		badge?: Snippet;
	}

	let { type = null, id = '', battery = null, rating = undefined, muted = false, badge = undefined }: Props = $props();

	function ratingLabel(rating: StationBikeRating | undefined) {
		if (rating === 1) return $t('bike_rating_bad');
		if (rating === 2) return $t('bike_rating_poor');
		if (rating === 3) return $t('bike_rating_neutral');
		if (rating === 4) return $t('bike_rating_ok');
		if (rating === 5) return $t('bike_rating_good');
		return '';
	}

	let hasRating = $derived(rating !== undefined && rating !== null);
	let accent = $derived(muted ? 'text-label' : 'text-primary');
	/** At or below this charge the battery badge turns to the warning colour, where its icon already shows empty. */
	const LOW_BATTERY_PERCENT = 20;
</script>

{#if type === 'electric'}
	<IconBolt size={42} stroke={1.7} class="{accent} -mx-3" />
{:else if type === 'classic'}
	<IconSettings size={42} stroke={1.7} class="{accent} -mx-3" />
{:else}
	<!-- Weird styling to perfectly align with the other icons -->
	<div class="text-label font-bold text-xl -mr-6 w-[42px]">--</div>
{/if}
<div class="relative h-[42px] min-w-0 grow overflow-hidden">
	<div class="absolute left-0 right-0 text-base font-bold {accent} leading-tight transition-all duration-150 ease-out {hasRating ? 'top-0 translate-y-[0px]' : 'top-1/2 -translate-y-1/2'} flex items-center gap-2">{id}{@render badge?.()}</div>
	{#if hasRating}
		<div class="absolute bottom-0 left-0 right-0 flex h-4 items-center gap-1 text-label" transition:fly={{ y: -4, duration: 150, opacity: 0 }}>
			{#if rating === 1}
				<IconMoodWrrr size={18} stroke={2} />
			{:else if rating === 2}
				<IconMoodConfuzed size={18} stroke={2}/>
			{:else if rating === 3}
				<IconMoodEmpty size={18} stroke={2} />
			{:else if rating === 4}
				<IconMoodSmile size={18} stroke={2} />
			{:else}
				<IconMoodHappy size={18} stroke={2} />
			{/if}
			<div class="translate-y-px truncate text-xs font-semibold uppercase leading-none">{ratingLabel(rating)}</div>
		</div>
	{/if}
</div>
{#if type === 'electric' && battery != null}
	<div class="flex items-center h-6 px-[6px] {battery <= LOW_BATTERY_PERCENT ? 'bg-warning' : muted ? 'bg-label' : 'bg-primary'} rounded-md gap-1">
		<span class="text-xs font-bold text-background">{battery}%</span>
		{#if battery <= LOW_BATTERY_PERCENT}
			<IconBattery size={25} stroke={1.7} class="text-background -m-1" />
		{:else if battery <= 40}
			<IconBattery1 size={25} stroke={1.7} class="text-background -m-1" />
		{:else if battery <= 60}
			<IconBattery2 size={25} stroke={1.7} class="text-background -m-1" />
		{:else if battery <= 80}
			<IconBattery3 size={25} stroke={1.7} class="text-background -m-1" />
		{:else}
			<IconBattery4 size={25} stroke={1.7} class="text-background -m-1" />
		{/if}
	</div>
{/if}
{#if type === null}
	<div class="flex items-center h-6 px-[6px] bg-label rounded-md gap-1">
		<span class="text-xs font-bold text-background">--</span>
		<IconBattery4 size={25} stroke={1.7} class="text-background -m-1" />
	</div>
{/if}