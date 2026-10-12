<script lang="ts">
	import { oldestOffset, periodStats, type StatsBucket, type StatsPeriod, type TripDaySummary } from '$lib/trip-stats';
	import { getLocale, t } from '$lib/translations';
	import IconChevronLeft from '@tabler/icons-svelte/icons/chevron-left';
	import IconChevronRight from '@tabler/icons-svelte/icons/chevron-right';
	import { fly } from 'svelte/transition';

	interface Props {
		/** null while loading */
		days: TripDaySummary[] | null;
	}

	let { days }: Props = $props();

	const periods: { period: StatsPeriod, label: 'stats_period_week' | 'stats_period_month' | 'stats_period_year' | 'stats_period_all' }[] = [
		{ period: 'week', label: 'stats_period_week' },
		{ period: 'month', label: 'stats_period_month' },
		{ period: 'year', label: 'stats_period_year' },
		{ period: 'all', label: 'stats_period_all' },
	];

	let period: StatsPeriod = $state('all');
	let selected: number | null = $state(null);
	/** How many periods before the current one is shown. */
	let offset = $state(0);
	/** Which side the bars slide in from: older periods from the left, newer from the right. */
	let direction = $state(0);

	// While loading, the card is laid out for an empty history and hidden behind the skeleton, so the
	// skeleton has exactly the card's size.
	let loading = $derived(days === null);
	let stats = $derived(periodStats(days ?? [], period, new Date, offset));
	let oldest = $derived(oldestOffset(days ?? [], period));
	let shown = $derived(selected === null ? stats.totals : stats.buckets[selected]);
	let maxDistance = $derived(Math.max(0, ...stats.buckets.map(bucket => bucket.distanceMeters)));
	// In the all-time chart, week labels ("15 Sept") are too wide for one under every bar, as are the labels
	// of its longer charts.
	let spacedLabels = $derived(period === 'all' && (stats.buckets.length > 12 || stats.buckets[0].unit === 'week'));
	let labelEvery = $derived(spacedLabels ? Math.ceil(stats.buckets.length / 4) : 1);

	function selectPeriod(next: StatsPeriod) {
		period = next;
		offset = 0;
		selected = null;
	}

	/** +1 for the previous period, -1 for the next one. */
	function move(step: number) {
		const next = Math.min(Math.max(offset + step, 0), oldest);
		if (next === offset) return;
		direction = step > 0 ? -1 : 1;
		offset = next;
		selected = null;
	}

	let swipeStart: { x: number, y: number } | null = null;
	let swiped = false;

	function onpointerdown(event: PointerEvent) {
		swipeStart = { x: event.clientX, y: event.clientY };
		swiped = false;
	}

	function onpointerup(event: PointerEvent) {
		if (!swipeStart) return;
		const dx = event.clientX - swipeStart.x, dy = event.clientY - swipeStart.y;
		swipeStart = null;
		if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
		swiped = true;
		// Like turning pages: swiping right brings in what came before.
		move(dx > 0 ? 1 : -1);
	}

	/** A swipe that starts and ends on the same bar would otherwise also select it. */
	function onclickcapture(event: MouseEvent) {
		if (!swiped) return;
		swiped = false;
		event.stopPropagation();
	}

	function number(value: number, maximumFractionDigits = 0) {
		return value.toLocaleString(getLocale(), { maximumFractionDigits });
	}

	/** Under 10 units with one decimal, so short rides still register. */
	function scaled(value: number) {
		return number(value, value < 10 ? 1 : 0);
	}

	function distance(meters: number) {
		return { value: scaled(meters / 1000), unit: 'km' };
	}

	function duration(seconds: number) {
		const minutes = Math.round(seconds / 60);
		const hours = Math.floor(minutes / 60);
		if (hours === 0) return [{ value: number(minutes), unit: $t('minutes_label') }];
		if (hours >= 10) return [{ value: number(hours), unit: $t('hours_label') }];
		return [{ value: number(hours), unit: $t('hours_label') }, { value: number(minutes % 60), unit: $t('minutes_label') }];
	}

	function formatDate(date: Date, options: Intl.DateTimeFormatOptions) {
		return date.toLocaleDateString(getLocale(), options);
	}

	function formatRange(start: Date, end: Date, options: Intl.DateTimeFormatOptions) {
		return new Intl.DateTimeFormat(getLocale(), options).formatRange(start, end);
	}

	/** Bar axis label: an abbreviated weekday or month when every bar gets one, the full year for years. */
	function shortLabel(bucket: StatsBucket) {
		if (bucket.unit === 'year') return String(bucket.start.getFullYear());
		if (bucket.unit === 'week') return formatDate(bucket.start, { day: 'numeric', month: 'short' });
		if (spacedLabels) return formatDate(bucket.start, bucket.unit === 'day' ? { day: 'numeric', month: 'short' } : { month: 'short', year: '2-digit' });
		// Without the full stop Portuguese abbreviations end in ("jan.", "seg."), which crowds the row.
		return formatDate(bucket.start, bucket.unit === 'day' ? { weekday: 'short' } : { month: 'short' }).replace(/\.$/, '');
	}

	function axisLabel(bucket: StatsBucket, i: number) {
		// The caption names the month, so its days just need numbering: 1, 8, 15, 22, 29.
		if (period === 'month') return i % 7 === 0 ? String(bucket.start.getDate()) : '';
		if (spacedLabels) return (stats.buckets.length - 1 - i) % labelEvery === 0 ? shortLabel(bucket) : '';
		return shortLabel(bucket);
	}

	function longLabel(bucket: StatsBucket) {
		const { start } = bucket;
		if (bucket.unit === 'year') return String(start.getFullYear());
		if (bucket.unit === 'month') return formatDate(start, { month: 'long', year: 'numeric' });
		if (bucket.unit === 'week') return formatRange(start, new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6), { day: 'numeric', month: 'long' });
		return formatDate(start, { weekday: 'long', day: 'numeric', month: 'long' });
	}

	/** The span the totals cover. */
	function rangeLabel(buckets: StatsBucket[]) {
		const first = buckets[0], last = buckets[buckets.length - 1];
		if (period === 'month') return formatDate(first.start, { month: 'long', year: 'numeric' });
		if (period === 'year') return String(first.start.getFullYear());
		if (first.unit === 'year') return formatRange(first.start, last.start, { year: 'numeric' });
		if (first.unit === 'month') return formatRange(first.start, last.start, { month: 'short', year: 'numeric' });
		// The all-time chart runs up to today; weekly bars only appear there.
		const end = first.unit === 'week' ? new Date : last.start;
		const options: Intl.DateTimeFormatOptions = end.getFullYear() === (new Date).getFullYear() ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' };
		return formatRange(first.start, end, options);
	}
</script>

{#snippet metric(parts: { value: string, unit: string }[], label: string)}
	<div class="flex flex-col items-center min-w-0">
		<div class="text-nowrap">
			{#each parts as part}<span class="text-xl font-bold text-primary pr-px">{part.value}</span><span class="text-xs font-semibold text-label">{part.unit}</span>{/each}
		</div>
		<span class="text-2xs font-semibold text-label text-center leading-none">{label.toUpperCase()}</span>
	</div>
{/snippet}

<!-- overflow-hidden keeps the bars of the next period inside the card while they slide in -->
<div class="rounded-2xl p-4 text-info overflow-hidden touch-pan-y {loading ? 'bg-background-secondary animate-pulse' : 'bg-background dark:bg-background-secondary'}" style:box-shadow="0px 0px 12px 0px var(--color-shadow)"
	role="group" {onpointerdown} {onpointerup} onpointercancel={() => swipeStart = null} {onclickcapture}
>
	<div class="flex flex-col gap-4" class:invisible={loading} inert={loading}>
		<div class="flex gap-1.5">
			{#each periods as option}
				<button
					class="grow h-8 rounded-full text-xs font-semibold transition-colors duration-150 {period === option.period ? 'bg-primary text-background' : 'bg-background-secondary text-info dark:bg-background-tertiary'}"
					onclick={() => selectPeriod(option.period)}
				>{$t(option.label)}</button>
			{/each}
		</div>
		<div class="flex flex-col gap-2">
			<div class="flex items-center justify-between">
				<button class="text-label -my-1" class:invisible={offset >= oldest} aria-label={$t('stats_previous_label')} onclick={() => move(1)}>
					<IconChevronLeft size={18} stroke={2.2} />
				</button>
				<div class="text-xs font-semibold text-label text-center first-letter:uppercase">
					{selected === null ? rangeLabel(stats.buckets) : longLabel(stats.buckets[selected])}
				</div>
				<button class="text-label -my-1" class:invisible={offset === 0} aria-label={$t('stats_next_label')} onclick={() => move(-1)}>
					<IconChevronRight size={18} stroke={2.2} />
				</button>
			</div>
			<div class="grid grid-cols-3 gap-1">
				{@render metric([{ value: number(shown.trips), unit: '' }], $t('stats_trips_label'))}
				{@render metric([distance(shown.distanceMeters)], $t('stats_distance_label'))}
				{@render metric(duration(shown.durationSeconds), $t('stats_time_label'))}
			</div>
		</div>
		{#key offset}
			<div class="flex flex-col gap-1" in:fly={{ x: direction * 40, duration: 200 }}>
				<div class="flex items-end h-20 {stats.buckets.length > 12 ? 'gap-[2px]' : 'gap-1.5'}">
					{#each stats.buckets as bucket, i}
						<button class="flex-1 h-full flex items-end" aria-label={longLabel(bucket)} disabled={bucket.future} onclick={() => selected = selected === i ? null : i}>
							<div
								class="w-full rounded-sm transition-all duration-300 {bucket.distanceMeters > 0 ? 'bg-primary' : 'bg-background-tertiary'}"
								class:opacity-40={bucket.future || selected !== null && selected !== i}
								style:height={bucket.distanceMeters > 0 && maxDistance > 0 ? `max(4px, ${bucket.distanceMeters / maxDistance * 100}%)` : '3px'}
							></div>
						</button>
					{/each}
				</div>
				<div class="flex {stats.buckets.length > 12 ? 'gap-[2px]' : 'gap-1.5'}">
					{#each stats.buckets as bucket, i}
						<div class="flex-1 min-w-0 flex {spacedLabels && i === stats.buckets.length - 1 ? 'justify-end' : 'justify-center'} text-2xs font-semibold text-label leading-none overflow-visible text-nowrap"
							class:opacity-40={bucket.future}
						>
							{axisLabel(bucket, i)}
						</div>
					{/each}
				</div>
			</div>
		{/key}
	</div>
</div>