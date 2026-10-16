import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlannedRoute } from '$lib/routing';

const mocks = vi.hoisted(() => ({
	putArrival: vi.fn(),
	deleteArrival: vi.fn(),
	storage: new Map<string, string>,
}));

vi.mock('$app/environment', () => ({ dev: false }));
vi.mock('$lib/gira-mais-api/gira-mais-api', () => {
	class GiraMaisApiError extends Error {
		constructor(readonly status: number) {
			super(`Gira+ API answered ${status}`);
		}
	}
	return { putArrival: mocks.putArrival, deleteArrival: mocks.deleteArrival, GiraMaisApiError };
});
vi.mock('$lib/routing', async () => {
	const { writable } = await import('svelte/store');
	return { currentRoute: writable(null), routeDestination: writable(null) };
});
vi.mock('$lib/trip', async () => {
	const { writable } = await import('svelte/store');
	return { currentTrip: writable(null), DEBUG_TRIP_CODE: 'DEBUG-TRIP' };
});
vi.mock('$lib/settings', async () => {
	const { writable } = await import('svelte/store');
	return { appSettings: writable({ shareArrivals: true }) };
});
vi.mock('$lib/location', async () => {
	const { writable } = await import('svelte/store');
	return { currentPos: writable(null) };
});
vi.mock('@capacitor/preferences', () => ({
	Preferences: {
		get: async ({ key }: { key: string }) => ({ value: mocks.storage.get(key) ?? null }),
		set: async ({ key, value }: { key: string; value: string }) => void mocks.storage.set(key, value),
		remove: async ({ key }: { key: string }) => void mocks.storage.delete(key),
	},
}));

import { dropoffArrival, resetArrivalSharing, startArrivalSharing } from './arrival-sharing';
import { GiraMaisApiError } from '$lib/gira-mais-api/gira-mais-api';
import { currentPos } from '$lib/location';
import { currentRoute, routeDestination } from '$lib/routing';
import { appSettings } from '$lib/settings';
import { currentTrip, type ActiveTrip } from '$lib/trip';

const NOW = Date.parse('2026-10-12T10:00:00Z');

function route(endStation: string | null, legs: [PlannedRoute['legs'][number]['mode'], number][], computedAt = NOW): PlannedRoute {
	return {
		legs: legs.map(([mode, duration]) => ({ mode, duration, distance: duration * 4, coordinates: [] })),
		totalDistance: 0,
		totalDuration: legs.reduce((sum, [, duration]) => sum + duration, 0),
		startStationSerial: null,
		endStationSerial: endStation,
		origin: { lat: 38.7, lng: -9.1 },
		destination: { type: 'location', lat: 38.72, lng: -9.14 },
		computedAt,
	};
}

function trip(code: string, confirmed = true) {
	return { code, confirmed, bikePlate: 'E1336' } as ActiveTrip;
}

/** Let the subscriptions' async work settle. */
const settle = () => vi.advanceTimersByTimeAsync(0);

describe('dropoffArrival', () => {
	it('counts the ride up to the drop-off station, not the walk after it', () => {
		expect(dropoffArrival(route('4551', [['bike', 300], ['foot', 120]]), NOW)).toEqual({ station: '4551', arrivesAt: new Date(NOW + 300_000) });
	});

	it('ignores routes planned before the trip, with a pickup station', () => {
		expect(dropoffArrival({ ...route('4551', [['foot', 60], ['bike', 300]]), startStationSerial: '100' })).toBeNull();
	});

	it('ignores routes without a drop-off station or a ride', () => {
		expect(dropoffArrival(route(null, [['foot', 600]]))).toBeNull();
		expect(dropoffArrival(route('4551', [['foot', 600]]))).toBeNull();
	});
});

describe('arrival sharing', () => {
	let stop: () => void;

	beforeEach(async () => {
		vi.useFakeTimers({ now: NOW });
		vi.clearAllMocks();
		mocks.putArrival.mockResolvedValue(undefined);
		mocks.deleteArrival.mockResolvedValue(undefined);
		mocks.storage.clear();
		await resetArrivalSharing();
		appSettings.set({ shareArrivals: true } as never);
		currentTrip.set(null);
		currentRoute.set(null);
		routeDestination.set(null);
		stop = startArrivalSharing();
		await settle();
	});

	afterEach(() => {
		stop();
		vi.useRealTimers();
	});

	async function startNavigating(code = '9001', station = '4551', rideSeconds = 300) {
		currentTrip.set(trip(code));
		routeDestination.set({ type: 'location', lat: 38.72, lng: -9.14 });
		currentRoute.set(route(station, [['bike', rideSeconds], ['foot', 60]], Date.now()));
		await settle();
	}

	it('shares the drop-off station and arrival time of a confirmed trip', async () => {
		await startNavigating();
		expect(mocks.putArrival).toHaveBeenCalledTimes(1);
		const [id, station, bike, arrivesAt] = mocks.putArrival.mock.calls[0];
		expect(id).toMatch(/^[A-Za-z0-9_-]{16,64}$/);
		expect(station).toBe('4551');
		expect(bike).toBe('E1336');
		expect(arrivesAt).toEqual(new Date(NOW + 300_000));
	});

	it('shares nothing for unconfirmed trips, debug trips, without a destination or with the setting off', async () => {
		currentTrip.set(trip('', false));
		currentRoute.set(route('4551', [['bike', 300]]));
		routeDestination.set({ type: 'location', lat: 38.72, lng: -9.14 });
		currentTrip.set(trip('DEBUG-TRIP'));
		appSettings.set({ shareArrivals: false } as never);
		currentTrip.set(trip('9001'));
		await settle();
		expect(mocks.putArrival).not.toHaveBeenCalled();
	});

	it('skips small drifts but sends a new station, a bigger shift, or a refresh', async () => {
		await startNavigating();
		const id = mocks.putArrival.mock.calls[0][0];

		await vi.advanceTimersByTimeAsync(10_000);
		currentRoute.set(route('4551', [['bike', 280]], Date.now())); // 10 s later than before
		await settle();
		expect(mocks.putArrival).toHaveBeenCalledTimes(1);

		currentRoute.set(route('4551', [['bike', 400]], Date.now()));
		await settle();
		expect(mocks.putArrival).toHaveBeenCalledTimes(2);

		currentRoute.set(route('7000', [['bike', 400]], Date.now()));
		await settle();
		expect(mocks.putArrival).toHaveBeenLastCalledWith(id, '7000', 'E1336', new Date(Date.now() + 400_000));

		await vi.advanceTimersByTimeAsync(60_000);
		currentRoute.set(route('7000', [['bike', 280]], Date.now()));
		await settle();
		expect(mocks.putArrival).toHaveBeenCalledTimes(4);
		expect(new Set(mocks.putArrival.mock.calls.map(call => call[0]))).toEqual(new Set([id]));
	});

	it('lets the arrival slip while the rider stands still, and refreshes it every minute', async () => {
		await startNavigating();
		const fix = () => currentPos.set({ coords: { latitude: 38.7, longitude: -9.1 }, timestamp: Date.now() } as never);

		await vi.advanceTimersByTimeAsync(20_000);
		fix();
		await settle();
		expect(mocks.putArrival).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(20_000);
		fix();
		await settle();
		expect(mocks.putArrival).toHaveBeenCalledTimes(2);
		expect(mocks.putArrival.mock.lastCall!.at(-1)).toEqual(new Date(NOW + 40_000 + 300_000));

		// Moving at the route's pace keeps the estimate put; the refresh still goes out a minute later
		for (let second = 0; second < 60; second += 10) {
			await vi.advanceTimersByTimeAsync(10_000);
			currentRoute.set(route('4551', [['bike', 300 - second - 10], ['foot', 60]], Date.now()));
			await settle();
		}
		expect(mocks.putArrival).toHaveBeenCalledTimes(3);
	});

	it('sends the plate once the trip learns it', async () => {
		currentTrip.set({ ...trip('9001'), bikePlate: null });
		routeDestination.set({ type: 'location', lat: 38.72, lng: -9.14 });
		currentRoute.set(route('4551', [['bike', 300]], Date.now()));
		await settle();
		currentTrip.set(trip('9001'));
		await settle();
		expect(mocks.putArrival.mock.calls.map(call => call[2])).toEqual([null, 'E1336']);
	});

	it('withdraws the arrival when the trip ends, the destination is cleared or sharing is turned off', async () => {
		await startNavigating();
		const id = mocks.putArrival.mock.calls[0][0];
		currentTrip.set(null);
		await settle();
		expect(mocks.deleteArrival).toHaveBeenCalledWith(id);

		await startNavigating('9002');
		const second = mocks.putArrival.mock.calls[1][0];
		expect(second).not.toBe(id);
		routeDestination.set(null);
		await settle();
		expect(mocks.deleteArrival).toHaveBeenLastCalledWith(second);

		await startNavigating('9003');
		appSettings.set({ shareArrivals: false } as never);
		await settle();
		expect(mocks.deleteArrival).toHaveBeenLastCalledWith(mocks.putArrival.mock.calls[2][0]);
	});

	it('keeps the arrival through a failed route recompute', async () => {
		await startNavigating();
		currentRoute.set(null);
		await settle();
		expect(mocks.deleteArrival).not.toHaveBeenCalled();
	});

	it('reuses the trip\'s arrival id after a restart, without withdrawing it while the trip is being restored', async () => {
		await startNavigating();
		const id = mocks.putArrival.mock.calls[0][0];
		stop();
		await resetArrivalSharing();
		currentTrip.set(null);
		routeDestination.set(null);
		currentRoute.set(null);
		vi.clearAllMocks();

		stop = startArrivalSharing();
		await settle();
		expect(mocks.deleteArrival).not.toHaveBeenCalled();
		await startNavigating();
		expect(mocks.putArrival).toHaveBeenCalledWith(id, '4551', 'E1336', expect.any(Date));
	});

	it('waits a minute after a network failure, but not after the server refused one', async () => {
		mocks.putArrival.mockRejectedValueOnce(new Error('offline'));
		await startNavigating();
		currentRoute.set(route('7000', [['bike', 300]], Date.now()));
		await settle();
		expect(mocks.putArrival).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(60_000);
		currentRoute.set(route('7000', [['bike', 300]], Date.now()));
		await settle();
		expect(mocks.putArrival).toHaveBeenCalledTimes(2);

		mocks.putArrival.mockRejectedValueOnce(new GiraMaisApiError(400));
		currentRoute.set(route('8000', [['bike', 300]], Date.now()));
		await settle();
		currentRoute.set(route('8000', [['bike', 310]], Date.now()));
		await settle();
		expect(mocks.putArrival).toHaveBeenCalledTimes(3);
		currentRoute.set(route('9000', [['bike', 300]], Date.now()));
		await settle();
		expect(mocks.putArrival).toHaveBeenCalledTimes(4);
	});
});