export type StatsTotals = { trips: number; distanceMeters: number; durationSeconds: number };
export type TripDaySummary = StatsTotals & { date: Date };
export type StatsPeriod = 'week' | 'month' | 'year' | 'all';
export type StatsUnit = 'day' | 'week' | 'month' | 'year';
/** `future` bars are the rest of the current week, month or year: drawn so the period reads as in progress. */
export type StatsBucket = StatsTotals & { start: Date; unit: StatsUnit; future: boolean };
export type PeriodStats = { totals: StatsTotals; buckets: StatsBucket[] };

// The "all time" chart uses the finest bars that keep their number manageable, so a short history isn't
// two lonely monthly bars: days up to a month, then weeks up to half a year, months up to two years, years.
const MAX_DAILY_BUCKETS = 31;
const MAX_WEEKLY_BUCKETS = 26;
const MAX_MONTHLY_BUCKETS = 24;
/** A history of only a few days still gets a week of daily bars. */
const MIN_DAILY_BUCKETS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The round distance (100 m, 200 m, 500 m, 1 km, 2 km, ...) for the chart's one gridline: the largest that
 * fits under the tallest bar, so the line sits in the top 60% of the chart. Null below 100 m.
 */
export function gridlineMeters(maxMeters: number): number | null {
	let best: number | null = null;
	for (let scale = 100; scale <= maxMeters; scale *= 10) {
		for (const step of [1, 2, 5]) if (step * scale <= maxMeters) best = step * scale;
	}
	return best;
}

/** VAIMOO's summary dates are "MM/dd/yyyy"; returned as local midnight so they bucket by calendar day. */
export function parseSummaryDate(value: string | null | undefined): Date | null {
	const us = value?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	const iso = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (!us && !iso) return null;
	const [year, month, day] = us ? [+us[3], +us[1], +us[2]] : [+iso![1], +iso![2], +iso![3]];
	const date = new Date(year, month - 1, day);
	return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

/** Weeks start on Monday, as they do in Portugal. */
function weekStart(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDay() + 6) % 7);
}

function bucketKey(date: Date, unit: StatsUnit) {
	if (unit === 'week') return bucketKey(weekStart(date), 'day');
	if (unit === 'year') return `${date.getFullYear()}`;
	if (unit === 'month') return `${date.getFullYear()}-${date.getMonth()}`;
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function earliest(days: TripDaySummary[], fallback: Date) {
	return days.reduce((min, entry) => entry.date < min ? entry.date : min, fallback);
}

/** Whole calendar days from `from` to `to`, rounded because a DST change makes the gap an hour off. */
function daysBetween(from: Date, to: Date) {
	const midnight = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
	return Math.round((midnight(to) - midnight(from)) / DAY_MS);
}

function monthsBetween(from: Date, to: Date) {
	return (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth();
}

/** How many periods back the one holding the first trip is, i.e. how far the chart can be moved back. */
export function oldestOffset(days: TripDaySummary[], period: StatsPeriod, now = new Date): number {
	if (period === 'all' || days.length === 0) return 0;
	const first = earliest(days, now);
	if (period === 'week') return Math.max(0, Math.round(daysBetween(weekStart(first), weekStart(now)) / 7));
	if (period === 'month') return Math.max(0, monthsBetween(first, now));
	return Math.max(0, now.getFullYear() - first.getFullYear());
}

/**
 * The bars of a calendar week (Monday to Sunday) or month by day, or of a calendar year by month, `offset`
 * periods before the current one; or of everything since the first trip.
 */
function bucketStarts(period: StatsPeriod, days: TripDaySummary[], now: Date, offset: number): { unit: StatsUnit; starts: Date[] } {
	const year = now.getFullYear(), month = now.getMonth(), day = now.getDate();
	const count = (length: number, at: (index: number) => Date) => Array.from({ length }, (_, i) => at(i));
	if (period === 'week') {
		const monday = weekStart(now);
		return { unit: 'day', starts: count(7, i => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - offset * 7 + i)) };
	}
	if (period === 'month') {
		const length = new Date(year, month - offset + 1, 0).getDate();
		return { unit: 'day', starts: count(length, i => new Date(year, month - offset, i + 1)) };
	}
	if (period === 'year') return { unit: 'month', starts: count(12, i => new Date(year - offset, i, 1)) };

	const range = (length: number, at: (offset: number) => Date) => Array.from({ length }, (_, i) => at(length - 1 - i));

	const first = earliest(days, now);
	const dayCount = daysBetween(first, now) + 1;
	if (dayCount <= MAX_DAILY_BUCKETS) return { unit: 'day', starts: range(Math.max(dayCount, MIN_DAILY_BUCKETS), offset => new Date(year, month, day - offset)) };
	const thisWeek = weekStart(now);
	const weeks = Math.round((thisWeek.getTime() - weekStart(first).getTime()) / (7 * DAY_MS)) + 1;
	if (weeks <= MAX_WEEKLY_BUCKETS) return { unit: 'week', starts: range(weeks, offset => new Date(thisWeek.getFullYear(), thisWeek.getMonth(), thisWeek.getDate() - offset * 7)) };
	const months = (year - first.getFullYear()) * 12 + month - first.getMonth() + 1;
	if (months <= MAX_MONTHLY_BUCKETS) return { unit: 'month', starts: range(months, offset => new Date(year, month - offset, 1)) };
	return { unit: 'year', starts: range(year - first.getFullYear() + 1, offset => new Date(year - offset, 0, 1)) };
}

/**
 * Totals for a period plus its chart bars: a calendar week or month by day or a calendar year by month,
 * the current one or `offset` periods earlier, or everything since the first trip by day, week, month or
 * year depending on how long ago that was.
 */
export function periodStats(days: TripDaySummary[], period: StatsPeriod, now = new Date, offset = 0): PeriodStats {
	const { unit, starts } = bucketStarts(period, days, now, offset);
	const buckets: StatsBucket[] = starts.map(start => ({ start, unit, future: start > now, trips: 0, distanceMeters: 0, durationSeconds: 0 }));
	const index = new Map(buckets.map((bucket, i) => [bucketKey(bucket.start, unit), i]));
	const totals: StatsTotals = { trips: 0, distanceMeters: 0, durationSeconds: 0 };
	for (const entry of days) {
		const i = index.get(bucketKey(entry.date, unit));
		if (i === undefined) continue;
		for (const target of [buckets[i], totals]) {
			target.trips += entry.trips;
			target.distanceMeters += entry.distanceMeters;
			target.durationSeconds += entry.durationSeconds;
		}
	}
	return { totals, buckets };
}