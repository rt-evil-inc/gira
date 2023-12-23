import { Geolocation, type Position } from '@capacitor/geolocation';
import { writable } from 'svelte/store';

export const currentPos = writable<Position|null>(null);

let watchId: string|null = null;
let tryWatching = false;

export async function watchPosition() {
	if (tryWatching) return;
	tryWatching = true;
	if (watchId !== null) return;
	watchId = await Geolocation.watchPosition({
		enableHighAccuracy: true,
		timeout: 10000,
	}, position => {
		if (position === null) return;
		currentPos.set(position);
	});
	tryWatching = false;
}