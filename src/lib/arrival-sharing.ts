import { dev } from '$app/environment';
import { deleteArrival, GiraMaisApiError, putArrival } from '$lib/gira-mais-api/gira-mais-api';
import { currentPos } from '$lib/location';
import { currentRoute, routeDestination, type PlannedRoute } from '$lib/routing';
import { appSettings } from '$lib/settings';
import { currentTrip, DEBUG_TRIP_CODE } from '$lib/trip';
import { Preferences } from '@capacitor/preferences';
import { get } from 'svelte/store';

// While a rider navigates to a destination, the Gira+ server is told which bike they ride, which station they
// will dock it at and when, so whoever looks at that station sees the bike on its way. Updates ride on location
// fixes and route recomputations, which keep coming in the background, where timers stop. The server drops an
// arrival that is overdue or hasn't been updated for a few minutes, so a missed withdrawal costs little.

/** A new estimate this much off the shared one is sent at once; smaller drifts wait for the refresh. */
const MIN_SHIFT_MS = 30_000;
/** Resent this often, so the server doesn't take it for abandoned (it drops arrivals after 3 minutes of silence). */
const REFRESH_AFTER_MS = 60_000;
const RETRY_AFTER_FAILURE_MS = 60_000;
/** The trip's arrival id, kept so an app restarted mid-trip updates its arrival instead of adding another. */
const ARRIVAL_KEY = 'arrivals/current';

type Arrival = { station: string; arrivesAt: Date };

/** Development shares nothing, like the other reports, unless it runs against a local gira-web; then debug trips do too. */
const LOCAL_SERVER = dev && !!import.meta.env.VITE_GIRA_MAIS_DEV_SERVER;

/**
 * The drop-off station of a route planned while riding, and when the rider will be there. The ride left is counted
 * from now, not from when the route was computed: the route is recomputed every 30 m the rider moves, so its ride
 * still lies ahead, and a rider waiting at a light sees the arrival slip later instead of turning overdue.
 */
export function dropoffArrival(route: PlannedRoute, now = Date.now()): Arrival | null {
	// A route with a pickup station was planned before the trip started; it is replaced once the trip is confirmed.
	if (!route.endStationSerial || route.startStationSerial !== null) return null;
	let seconds = 0;
	let rideSeconds: number | null = null;
	for (const leg of route.legs) {
		seconds += leg.duration;
		if (leg.mode === 'bike') rideSeconds = seconds;
	}
	if (rideSeconds === null) return null;
	return { station: route.endStationSerial, arrivesAt: new Date(now + rideSeconds * 1000) };
}

/** What should be shared now: an arrival, nothing (null), or whatever already is (undefined). */
function wanted(): (Arrival & { tripCode: string; bike: string | null }) | null | undefined {
	const settings = get(appSettings);
	if (!settings) return undefined; // still loading
	const trip = get(currentTrip);
	if (!trip?.confirmed || !trip.code || trip.code === DEBUG_TRIP_CODE && !LOCAL_SERVER) return null;
	if (dev && !LOCAL_SERVER || !settings.shareArrivals || !get(routeDestination)) return null;
	const route = get(currentRoute);
	const arrival = route && dropoffArrival(route);
	// No usable route at the moment (a recompute failed, or the one shown predates the trip): leave it as it is.
	return arrival ? { tripCode: trip.code, bike: trip.bikePlate, ...arrival } : undefined;
}

/** The trip being shared and its arrival id. */
let shared: { tripCode: string; id: string } | null = null;
/** What the server has under that id. */
let sent: { station: string; bike: string | null; arrivesAt: number; at: number } | null = null;
let retryAt = 0;
let restored = false;

function newArrivalId() {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function restoreShared() {
	if (restored) return;
	restored = true;
	const { value } = await Preferences.get({ key: ARRIVAL_KEY });
	try {
		const stored = value ? JSON.parse(value) : null;
		if (typeof stored?.tripCode === 'string' && typeof stored?.id === 'string') shared = stored;
	} catch {
		// Unreadable; a new id will do
	}
}

async function withdraw() {
	const id = shared!.id;
	shared = null;
	sent = null;
	await Preferences.remove({ key: ARRIVAL_KEY });
	await deleteArrival(id).catch(error => console.warn('Could not withdraw the shared arrival', error));
}

async function step() {
	await restoreShared();
	const want = wanted();
	if (want === undefined) return;
	// An id restored at startup is kept while there's no trip: VAIMOO hasn't confirmed the trip yet. If it has
	// ended meanwhile, the server lets the arrival expire and the next trip replaces the id.
	if (shared && (want === null ? sent !== null : shared.tripCode !== want.tripCode)) await withdraw();
	if (want === null || Date.now() < retryAt) return;

	if (!shared) {
		shared = { tripCode: want.tripCode, id: newArrivalId() };
		await Preferences.set({ key: ARRIVAL_KEY, value: JSON.stringify(shared) });
	}
	const arrivesAt = want.arrivesAt.getTime();
	if (sent && sent.station === want.station && sent.bike === want.bike && Math.abs(sent.arrivesAt - arrivesAt) < MIN_SHIFT_MS && Date.now() - sent.at < REFRESH_AFTER_MS) return;
	try {
		await putArrival(shared.id, want.station, want.bike, want.arrivesAt);
		sent = { station: want.station, bike: want.bike, arrivesAt, at: Date.now() };
	} catch (error) {
		console.warn('Could not share the arrival', error);
		// The server refused this one; sending it again won't help, but a later estimate may go through.
		if (error instanceof GiraMaisApiError) sent = { station: want.station, bike: want.bike, arrivesAt, at: Date.now() };
		else retryAt = Date.now() + RETRY_AFTER_FAILURE_MS;
	}
}

let running = false;
let rerun = false;

/** Bring the shared arrival up to date, one request at a time; changes made meanwhile are picked up after. */
async function sync() {
	if (running) {
		rerun = true;
		return;
	}
	running = true;
	try {
		do {
			rerun = false;
			await step();
		} while (rerun);
	} catch (error) {
		console.error('Arrival sharing failed', error);
	} finally {
		running = false;
	}
}

/** Share the rider's arrival while they navigate on a trip. Returns a function that stops listening. */
export function startArrivalSharing() {
	const unsubscribers = [currentTrip, currentRoute, routeDestination, appSettings, currentPos].map(store => store.subscribe(() => void sync()));
	return () => unsubscribers.forEach(unsubscribe => unsubscribe());
}

/** For tests: forget everything and wait for the work in flight. */
export async function resetArrivalSharing() {
	while (running) await new Promise(resolve => setTimeout(resolve, 0));
	shared = null;
	sent = null;
	retryAt = 0;
	restored = false;
}