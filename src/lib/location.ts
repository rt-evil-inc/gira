import { registerPlugin } from '@capacitor/core';
import { get, writable } from 'svelte/store';
import { type Position, Geolocation } from '@capacitor/geolocation';
import type { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { checkTripActive, currentTrip } from '$lib/trip';
import { distanceBetweenCoords } from '$lib/utils';
import { MIN_TRAVEL_DISTANCE_m } from '$lib/constants';
import { appSettings } from './settings';

export const currentPos = writable<Position|null>(null);
export const bearingNorth = writable<boolean>(false);
export const bearing = writable<number>(0);

currentPos.subscribe(async v => {
	if (!v) return;
	currentTrip.update(trip => {
		if (!trip) return trip;
		trip.pathTaken.push({ lat: v.coords.latitude, lng: v.coords.longitude, time: new Date(v.timestamp) });

		if (trip.pathTaken.length > 1) {
			const lastLocation = trip.pathTaken[trip.pathTaken.length - 2];
			const traveledDistance = distanceBetweenCoords(lastLocation.lat, lastLocation.lng, v.coords.latitude, v.coords.longitude);
			trip.traveledDistanceKm += traveledDistance;
			const speed = (trip.traveledDistanceKm / ((v.timestamp - trip.startDate.getTime()) / 1000)) * 3600;
			if (traveledDistance >= MIN_TRAVEL_DISTANCE_m / 1000) trip.speed = speed;
		}
		return trip;
	});
});

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

let watchId: string|null = null;
let backgroundWatchId: string|null = null;

export async function watchPosition() {
	if (get(currentTrip) !== null && get(appSettings).backgroundLocation) {
		if (backgroundWatchId !== null) return;
		if (watchId !== null) {
			await Geolocation.clearWatch({ id: watchId });
			watchId = null;
		}

		backgroundWatchId = await BackgroundGeolocation.addWatcher({
			backgroundTitle: 'Active Trip',
			backgroundMessage: 'Tracking location in background',
			distanceFilter: 2,
		}, position => {
			if (position) {
				currentPos.set({ coords: { ...position, heading: position.bearing }, timestamp: (new Date).getTime() });
			}
			checkTripActive();
		});
	} else {
		if (watchId !== null) return;
		if (backgroundWatchId !== null) {
			await BackgroundGeolocation.removeWatcher({ id: backgroundWatchId });
			backgroundWatchId = null;
		}

		watchId = await Geolocation.watchPosition({
			enableHighAccuracy: true,
			timeout: 10000,
		}, position => {
			if (position) {
				currentPos.set(position);
			};
		});
	}
}