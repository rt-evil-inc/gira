import { registerPlugin } from '@capacitor/core';
import { get, writable } from 'svelte/store';
import { type Position, Geolocation } from '@capacitor/geolocation';
import type { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';
import { appSettings, currentTrip } from '$lib/state';

export const currentPos = writable<Position|null>(null);
export const bearingNorth = writable<boolean>(false);
export const bearing = writable<number>(0);

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
			if (position === null) return;
			currentPos.set(position);
		});
	}
}