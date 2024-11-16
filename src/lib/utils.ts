import { CapacitorHttp, type HttpOptions } from '@capacitor/core';

export const deg2rad = (deg:number) => deg * (Math.PI / 180);

export function distanceBetweenCoords(lat1:number, lon1:number, lat2:number, lon2:number) {
	const R = 6371;
	const dLat = deg2rad(lat2 - lat1);
	const dLon = deg2rad(lon2 - lon1);
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const d = R * c;
	return d;
}

export function formatDistance(distance:number) {
	if (distance < 1) return `${(distance * 1000).toFixed(0)}m`;
	return `${distance.toLocaleString(undefined, { maximumFractionDigits: 2, useGrouping: false })}km`;
}

export function randomUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8;
		return v.toString(16);
	});
}

const maxAttempts = 5;
const retryDelay = 1000;
export async function httpRequestWithRetry(options: HttpOptions, retryOnStatus = false) {
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const response = await CapacitorHttp.request(options);
			if (retryOnStatus && (response.status < 200 || response.status >= 300)) {
				throw response;
			}
			return response;
		} catch (error) {
			console.error(`Attempt ${attempt}:`, error);
			if (attempt < maxAttempts) {
				await new Promise(resolve => setTimeout(resolve, retryDelay * attempt)); // Linear backoff
			} else {
				console.error('Max attempts reached. Throwing error.');
				throw error;
			}
		}
	}
}