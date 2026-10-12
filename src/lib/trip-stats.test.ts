import { describe, expect, it } from 'vitest';
import { oldestOffset, parseSummaryDate, periodStats, type TripDaySummary } from './trip-stats';

const day = (year: number, month: number, date: number, trips = 1, distanceMeters = 1000, durationSeconds = 600): TripDaySummary => ({
	date: new Date(year, month - 1, date), trips, distanceMeters, durationSeconds,
});
const now = new Date(2026, 9, 12, 18, 30);

describe('VAIMOO summary dates', () => {
	it('reads month-first dates as local midnight', () => {
		expect(parseSummaryDate('10/05/2026')).toEqual(new Date(2026, 9, 5));
		expect(parseSummaryDate('1/9/2026')).toEqual(new Date(2026, 0, 9));
		expect(parseSummaryDate('2026-10-05T00:00:00')).toEqual(new Date(2026, 9, 5));
	});

	it('rejects missing and impossible dates', () => {
		expect(parseSummaryDate(null)).toBeNull();
		expect(parseSummaryDate('')).toBeNull();
		expect(parseSummaryDate('13/01/2026')).toBeNull();
		expect(parseSummaryDate('02/30/2026')).toBeNull();
	});
});

describe('trip statistics periods', () => {
	it('splits the calendar week into days, Monday to Sunday', () => {
		const wednesday = new Date(2026, 9, 14, 9);
		const stats = periodStats([day(2026, 10, 14, 2, 3000, 900), day(2026, 10, 12), day(2026, 10, 11)], 'week', wednesday);
		expect(stats.buckets.map(bucket => bucket.start.getDate())).toEqual([12, 13, 14, 15, 16, 17, 18]);
		expect(stats.buckets[2]).toMatchObject({ trips: 2, distanceMeters: 3000, durationSeconds: 900, future: false });
		expect(stats.buckets.map(bucket => bucket.future)).toEqual([false, false, false, true, true, true, true]);
		expect(stats.totals).toEqual({ trips: 3, distanceMeters: 4000, durationSeconds: 1500 });
	});

	it('splits the calendar month into its days', () => {
		const stats = periodStats([day(2026, 10, 1), day(2026, 9, 30)], 'month', now);
		expect(stats.buckets).toHaveLength(31);
		expect([stats.buckets[0].start, stats.buckets[30].start]).toEqual([new Date(2026, 9, 1), new Date(2026, 9, 31)]);
		expect(stats.buckets.filter(bucket => bucket.future)).toHaveLength(19);
		expect(stats.totals.trips).toBe(1);
		expect(periodStats([], 'month', new Date(2026, 1, 10)).buckets).toHaveLength(28);
	});

	it('splits the calendar year into months', () => {
		const stats = periodStats([day(2026, 10, 1), day(2026, 10, 11), day(2026, 1, 1), day(2025, 12, 31)], 'year', now);
		expect(stats.buckets.map(bucket => [bucket.start.getFullYear(), bucket.start.getMonth() + 1])).toEqual([
			[2026, 1], [2026, 2], [2026, 3], [2026, 4], [2026, 5], [2026, 6], [2026, 7], [2026, 8], [2026, 9], [2026, 10], [2026, 11], [2026, 12],
		]);
		expect(stats.buckets[0].trips).toBe(1);
		expect(stats.buckets[9]).toMatchObject({ trips: 2, future: false });
		expect(stats.buckets.slice(10).every(bucket => bucket.future)).toBe(true);
		expect(stats.totals.trips).toBe(3);
	});

	it('shows a short history by day, with at least a week of bars', () => {
		const daily = periodStats([day(2026, 9, 15), day(2026, 10, 1)], 'all', now);
		expect(daily.buckets).toHaveLength(28);
		expect(daily.buckets[0]).toMatchObject({ unit: 'day', start: new Date(2026, 8, 15), trips: 1 });
		expect(daily.totals.trips).toBe(2);

		const padded = periodStats([day(2026, 10, 11)], 'all', now);
		expect(padded.buckets.map(bucket => bucket.start.getDate())).toEqual([6, 7, 8, 9, 10, 11, 12]);
	});

	it('switches to Monday-to-Sunday weeks past a month', () => {
		const stats = periodStats([day(2026, 9, 1), day(2026, 9, 6), day(2026, 10, 12)], 'all', now);
		expect(stats.buckets.map(bucket => [bucket.unit, bucket.start.getMonth() + 1, bucket.start.getDate()])).toEqual([
			['week', 8, 31], ['week', 9, 7], ['week', 9, 14], ['week', 9, 21], ['week', 9, 28], ['week', 10, 5], ['week', 10, 12],
		]);
		expect(stats.buckets[0].trips).toBe(2);
		expect(stats.buckets[6].trips).toBe(1);
	});

	it('uses months past half a year and years past two', () => {
		const monthly = periodStats([day(2025, 9, 3), day(2026, 10, 1)], 'all', now);
		expect(monthly.buckets).toHaveLength(14);
		expect(monthly.buckets[0]).toMatchObject({ unit: 'month', start: new Date(2025, 8, 1), trips: 1 });
		expect(monthly.totals.trips).toBe(2);

		const yearly = periodStats([day(2023, 3, 3), day(2026, 10, 1)], 'all', now);
		expect(yearly.buckets.map(bucket => [bucket.unit, bucket.start.getFullYear(), bucket.trips])).toEqual([
			['year', 2023, 1], ['year', 2024, 0], ['year', 2025, 0], ['year', 2026, 1],
		]);
	});

	it('still has a week of bars without any trips', () => {
		const stats = periodStats([], 'all', now);
		expect(stats.buckets).toHaveLength(7);
		expect(stats.totals).toEqual({ trips: 0, distanceMeters: 0, durationSeconds: 0 });
	});

	it('moves back whole calendar periods', () => {
		const days = [day(2026, 10, 11), day(2026, 10, 5), day(2026, 9, 30), day(2026, 9, 1), day(2025, 3, 3)];
		const week = periodStats(days, 'week', now, 1);
		expect([week.buckets[0].start, week.buckets[6].start]).toEqual([new Date(2026, 9, 5), new Date(2026, 9, 11)]);
		expect(week.totals.trips).toBe(2);
		expect(week.buckets.some(bucket => bucket.future)).toBe(false);

		const month = periodStats(days, 'month', now, 1);
		expect(month.buckets).toHaveLength(30);
		expect(month.buckets[0].start).toEqual(new Date(2026, 8, 1));
		expect(month.totals.trips).toBe(2);

		const year = periodStats(days, 'year', now, 1);
		expect(year.buckets[0].start).toEqual(new Date(2025, 0, 1));
		expect(year.totals.trips).toBe(1);
	});

	it('stops moving back at the period holding the first trip', () => {
		const days = [day(2026, 9, 15), day(2026, 10, 10)];
		expect(oldestOffset(days, 'week', now)).toBe(4);
		expect(periodStats(days, 'week', now, 4).buckets[0].start).toEqual(new Date(2026, 8, 14));
		expect(oldestOffset(days, 'month', now)).toBe(1);
		expect(oldestOffset(days, 'year', now)).toBe(0);
		expect(oldestOffset([day(2025, 12, 31)], 'year', now)).toBe(1);
		expect(oldestOffset([day(2026, 10, 12)], 'week', now)).toBe(0);
		expect(oldestOffset(days, 'all', now)).toBe(0);
		expect(oldestOffset([], 'week', now)).toBe(0);
	});
});