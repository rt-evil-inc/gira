import { get, writable } from 'svelte/store';
import type { ThrownError } from '$lib/gira-api/api-types';
import { accountInfo } from '$lib/account';
import { errorMessages } from '$lib/ui';
import { appSettings } from '$lib/settings';
import { currentPos, watchPosition } from '$lib/location';
import { distanceBetweenCoords } from '$lib/utils';
import { LOCK_DISTANCE_m } from '$lib/constants';
import { getTripHistory, getUnratedTrips, knownErrors, reserveBike, startTrip, tripPayWithPoints } from '$lib/gira-api/api';
import type { StationInfo } from './map';
import { ingestLastUnratedTrip, updateActiveTripInfo } from './injest-api-data';
import { reportErrorEvent, reportTripStartEvent } from '$lib/gira-mais-api/gira-mais-api';
import { refreshToken, token, type JWT } from './account';
import { t } from './translations';
import { tick } from 'svelte';

export type ActiveTrip = {
	code: string,
	bikePlate: string|null,
	startPos: {lat: number, lng: number}|null,
	destination: {lat: number, lng: number}|null,
	traveledDistanceKm: number,
	distanceLeft: number|null,
	speed: number,
	startDate: Date,
	predictedEndDate: Date|null,
	arrivalTime: Date|null,
	finished: boolean,
	confirmed: boolean,
	pathTaken : {lat: number, lng: number, time:Date}[],
	lastUpdate: Date | null,
}
export type TripRating = {
	currentRating:{
		code:string,
		bikePlate:string|null,
		startDate:Date,
		endDate:Date,
		tripPoints:number,
	}|null,
}

export const currentTrip = writable<ActiveTrip|null>(null);
export const tripRating = writable<TripRating>({ currentRating: null });

// FAKE DATA FOR SCREENSHOTS - Remove before production
export function createFakeTrip() {
	// Fake bike path from Cais do Sodré area to Campo Grande (~1.2km)
	// Following realistic streets and bike paths in Lisbon
	const fakePath = [
		{ lat: 38.746036, lng: -9.147943, time: new Date(Date.now() - 60 * 1000) },
		{ lat: 38.747912, lng: -9.148398, time: new Date(Date.now() - 60 * 1000) },
		{ lat: 38.747929, lng: -9.148427, time: new Date(Date.now() - 60 * 1000) },
		{ lat: 38.747913, lng: -9.148576, time: new Date(Date.now() - 35 * 60 * 1000) },
		{ lat: 38.748092, lng: -9.148843, time: new Date(Date.now() - 30 * 60 * 1000) },
		{ lat: 38.748278, lng: -9.148863, time: new Date(Date.now() - 30 * 60 * 1000) },
		{ lat: 38.748482, lng: -9.148684, time: new Date(Date.now() - 20 * 60 * 1000) },
		{ lat: 38.748640, lng: -9.148832, time: new Date(Date.now() - 15 * 60 * 1000) },
		{ lat: 38.748713, lng: -9.148620, time: new Date(Date.now() - 12 * 60 * 1000) },
		{ lat: 38.748819, lng: -9.148673, time: new Date(Date.now() - 10 * 1000) },
		{ lat: 38.751767, lng: -9.150800, time: new Date(Date.now() - 30 * 1000) },
		{ lat: 38.752749, lng: -9.151496, time: new Date(Date.now() - 15 * 1000) },
	];

	const fakeTrip: ActiveTrip = {
		code: 'FAKE_TRIP_123',
		bikePlate: 'E2024',
		startPos: fakePath[0],
		destination: null, // Campo Grande
		traveledDistanceKm: 1.2,
		distanceLeft: null,
		speed: 15.5, // km/h
		startDate: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
		predictedEndDate: null,
		arrivalTime: null,
		finished: false,
		confirmed: true,
		pathTaken: fakePath,
		lastUpdate: new Date,
	};

	return fakeTrip;
}

async function checkTripStarted(serial: string) {
	if (get(currentTrip) === null) return;
	if ((await reserveBike(serial)).reserveBike) {
		currentTrip.set(null);
	} else if (!get(currentTrip)?.confirmed) {
		updateActiveTripInfo();
	}
}

export async function tryStartTrip(id: string, serial: string, station: StationInfo) {
	if (serial == null) return;
	try {
		if (get(appSettings).distanceLock) {
			const pos = get(currentPos);
			if (pos == null) {
				errorMessages.add(get(t)('location_determination_error'));
				return false;
			} else {
				if (distanceBetweenCoords(pos.coords.latitude, pos.coords.longitude, station.latitude, station.longitude) > LOCK_DISTANCE_m / 1000) {
					errorMessages.add(get(t)('not_close_enough_error'));
					return false;
				}
			}
		}
		const reservedBike = (await reserveBike(serial)).reserveBike;
		if (reservedBike) {
			const success = (await startTrip()).startTrip;
			if (success) {
				reportTripStartEvent(serial, station.serialNumber);
				for (let i = 15000; i <= 30000; i += 5000) {
					setTimeout(() => checkTripStarted(serial), i);
				}
				const pos = get(currentPos);
				currentTrip.set({
					code: '',
					arrivalTime: null,
					bikePlate: id,
					traveledDistanceKm: 0,
					destination: null,
					distanceLeft: null,
					speed: 0,
					startDate: new Date,
					startPos: pos ? {
						lng: pos.coords.longitude,
						lat: pos.coords.latitude,
					} : null,
					predictedEndDate: null,
					finished: false,
					confirmed: false,
					pathTaken: pos ? [{
						lng: pos.coords.longitude,
						lat: pos.coords.latitude,
						time: new Date,
					}] : [],
					lastUpdate: new Date,
				});
				watchPosition();
				return true;
			} else {
				errorMessages.add(get(t)('bike_unlock_error'));
				reportErrorEvent('bike_unlock_error');
				return false;
			}
		}
	} catch (_e) {
		const e = _e as ThrownError;
		let addedError = false;
		if (e && e.errors) {
			for (const error of e.errors) {
				if (knownErrors[error.message]?.message) {
					errorMessages.add(get(t)(knownErrors[error.message].message!));
					addedError = true;
				}
				reportErrorEvent('gira_api_error', error.message);
			}
			if (!addedError) {
				errorMessages.add(get(t)('bike_unlock_error'));
			}
		}
		console.error(e);
		return false;
	}
}

/** Force trip info update if more than 30 seconds have passed since last update.
	* Meant to be called while the app is in background. */
export function checkTripActive() {
	const lastUpdate = get(currentTrip)?.lastUpdate;
	if (!lastUpdate || Date.now() - lastUpdate.getTime() < 1000 * 30) return;

	const t = get(token);
	if (!t) return;
	const jwt:JWT = JSON.parse(window.atob(t.accessToken.split('.')[1]));

	// Refresh token if it expires in less than 30 seconds and update trip info
	if (jwt.exp * 1000 - Date.now() < 30 * 1000) {
		refreshToken().then(updateActiveTripInfo);
	} else {
		updateActiveTripInfo();
	}
}

/** Gracefully end the trip.
  * Meant to be called when an abrupt trip end was detected. */
export async function endTrip() {
	const trip = get(currentTrip);

	// Attempt to pay with points just in case
	if (trip) tripPayWithPoints(trip.code);

	currentTrip.set(null);

	// Check if there is a rating to be done
	ingestLastUnratedTrip({
		unratedTrips: (await getUnratedTrips(0, 1)).unratedTrips,
		tripHistory: (await getTripHistory(0, 1)).tripHistory,
	});
}

await tick();
currentTrip.set(createFakeTrip());

currentTrip.set = (...args) => {};