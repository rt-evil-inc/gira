import { dev, version } from '$app/environment';
import { GIRA_MAIS_API_URL } from '$lib/constants';
import type { ArrivalPutRequest, BikeRatingPostRequest, BikeRatingPostResponse, ErrorStatisticsPostRequest, ErrorStatisticsPostResponse, MessageGetResponse, StationArrivalsGetResponse, StationBikeRatingsGetResponse, TripStatisticsPostRequest, TripStatisticsPostResponse, UnlockAttemptPostRequest, UnlockResultPostRequest, UnlockStatisticsPostResponse, UsageStatisticsPostRequest, UsageStatisticsPostResponse } from '$lib/gira-mais-api/types';
import { appSettings } from '$lib/settings';
import { getLocale } from '$lib/translations';
import type { TripRatingDetails } from '$lib/trip-rating';
import { httpRequestWithRetry } from '$lib/utils';
import { Device } from '@capacitor/device';
import type { HttpResponse } from '@capacitor/core';
import { get } from 'svelte/store';

export async function reportAppUsageEvent() {
	if (!get(appSettings).analytics || dev) return;

	const deviceInfo = await Device.getInfo();

	const response = await httpRequestWithRetry({
		method: 'post',
		url: GIRA_MAIS_API_URL + '/statistics/usage',
		headers: {
			'User-Agent': `Gira+/${version}`,
			'Content-Type': 'application/json',
		},
		data: {
			deviceId: (await Device.getId()).identifier,
			appVersion: version,
			os: deviceInfo.platform,
			osVersion: deviceInfo.osVersion,
		} as UsageStatisticsPostRequest,
	});
	return response?.data as UsageStatisticsPostResponse;
}

export async function reportTripStartEvent(bikeSerial: string | null, stationSerial: string | null) {
	if (!get(appSettings).analytics || dev) return;

	const response = await httpRequestWithRetry({
		method: 'post',
		url: GIRA_MAIS_API_URL + '/statistics/trips',
		headers: {
			'User-Agent': `Gira+/${version}`,
			'Content-Type': 'application/json',
		},
		data: {
			deviceId: (await Device.getId()).identifier,
			bikeSerial,
			stationSerial,
		} as TripStatisticsPostRequest,
	});
	return response?.data as TripStatisticsPostResponse;
}

/**
 * Report an error to the Gira+ statistics backend. Never throws: telemetry must not break the operation
 * that failed, and most callers fire and forget.
 */
export async function reportErrorEvent(errorCode: string, errorMessage: string | null = null) {
	if (!get(appSettings).analytics || dev) return;

	try {
		const response = await httpRequestWithRetry({
			method: 'post',
			url: GIRA_MAIS_API_URL + '/statistics/errors',
			headers: {
				'User-Agent': `Gira+/${version}`,
				'Content-Type': 'application/json',
			},
			data: {
				deviceId: (await Device.getId()).identifier,
				errorCode,
				errorMessage,
			} as ErrorStatisticsPostRequest,
		});
		return response?.data as ErrorStatisticsPostResponse;
	} catch (error) {
		console.warn(`Could not report error event ${errorCode}`, error);
	}
}

export async function reportUnlockAttemptEvent(attempt: Omit<UnlockAttemptPostRequest, 'deviceId'>) {
	if (!get(appSettings).analytics || dev) return;

	const response = await httpRequestWithRetry({
		method: 'post',
		url: GIRA_MAIS_API_URL + '/statistics/unlocks',
		headers: {
			'User-Agent': `Gira+/${version}`,
			'Content-Type': 'application/json',
		},
		data: {
			...attempt,
			deviceId: (await Device.getId()).identifier,
		} as UnlockAttemptPostRequest,
	});
	return response?.data as UnlockStatisticsPostResponse;
}

export async function reportUnlockResultEvent(attemptId: string, result: Omit<UnlockResultPostRequest, 'deviceId'>) {
	if (!get(appSettings).analytics || dev) return;

	const response = await httpRequestWithRetry({
		method: 'post',
		url: GIRA_MAIS_API_URL + `/statistics/unlocks/${encodeURIComponent(attemptId)}/result`,
		headers: {
			'User-Agent': `Gira+/${version}`,
			'Content-Type': 'application/json',
		},
		data: {
			...result,
			deviceId: (await Device.getId()).identifier,
		} as UnlockResultPostRequest,
	});
	return response?.data as UnlockStatisticsPostResponse;
}

export async function getMessage() {
	const response = await httpRequestWithRetry({
		method: 'get',
		url: GIRA_MAIS_API_URL + '/message',
		headers: {
			'User-Agent': `Gira+/${version}`,
			'Content-Type': 'application/json',
			'Accept-Language': getLocale(),
		},
	});
	return response?.data as MessageGetResponse;
}

export async function postBikeRating(tripCode: string, bikePlate: string, rating: number, timestamp?: string, details?: TripRatingDetails) {
	if (!get(appSettings).reportRatings || dev) return;

	const response = await httpRequestWithRetry({
		method: 'post',
		url: GIRA_MAIS_API_URL + '/statistics/ratings',
		headers: {
			'User-Agent': `Gira+/${version}`,
			'Content-Type': 'application/json',
		},
		data: {
			deviceId: (await Device.getId()).identifier,
			tripCode,
			bikePlate,
			rating,
			...timestamp && { timestamp },
			...details && { reasons: details.reasons, ...details.comment && { comment: details.comment } },
		} as BikeRatingPostRequest,
	});
	return response?.data as BikeRatingPostResponse;
}

export async function getStationBikeRatings(bikeIds: string[]) {
	try {
		const response = await httpRequestWithRetry({
			method: 'get',
			url: GIRA_MAIS_API_URL + '/statistics/ratings/station?bikes=' + bikeIds.map(encodeURIComponent).join(','),
			headers: {
				'User-Agent': `Gira+/${version}`,
				'Content-Type': 'application/json',
			},
		});

		return response?.data as StationBikeRatingsGetResponse;
	} catch (error) {
		reportErrorEvent('bike_ratings_fetch_error', JSON.stringify({
			bikeIds,
			error: error instanceof Error ? error.message : error,
		}));
		throw error;
	}
}

/** A request the server answered with an error status, which is not worth sending again as it is. */
export class GiraMaisApiError extends Error {
	constructor(readonly status: number) {
		super(`Gira+ API answered ${status}`);
	}
}

function checkStatus(response: HttpResponse | undefined): asserts response is HttpResponse {
	if (!response || response.status >= 500) throw new Error(`Gira+ API answered ${response?.status}`);
	if (response.status >= 400) throw new GiraMaisApiError(response.status);
}

/** Share when the rider expects to dock the bike at a station, under the trip's arrival id. */
export async function putArrival(arrivalId: string, station: string, bike: string | null, arrivesAt: Date) {
	const response = await httpRequestWithRetry({
		method: 'put',
		url: GIRA_MAIS_API_URL + `/arrivals/${encodeURIComponent(arrivalId)}`,
		headers: {
			'User-Agent': `Gira+/${version}`,
			'Content-Type': 'application/json',
		},
		data: { station, bike, arrivesAt: arrivesAt.toISOString() } as ArrivalPutRequest,
	});
	checkStatus(response);
}

export async function deleteArrival(arrivalId: string) {
	const response = await httpRequestWithRetry({
		method: 'delete',
		url: GIRA_MAIS_API_URL + `/arrivals/${encodeURIComponent(arrivalId)}`,
		headers: { 'User-Agent': `Gira+/${version}` },
	});
	checkStatus(response);
}

export type StationArrival = { arrivesAt: Date; bike: string | null };

/** The bikes riders are bringing to the station and when they are expected, soonest first. */
export async function getStationArrivals(station: string): Promise<StationArrival[]> {
	const response = await httpRequestWithRetry({
		method: 'get',
		url: GIRA_MAIS_API_URL + `/arrivals?station=${encodeURIComponent(station)}`,
		headers: { 'User-Agent': `Gira+/${version}` },
	});
	checkStatus(response);
	const arrivals = (response.data as StationArrivalsGetResponse | null)?.arrivals ?? [];
	return arrivals
		.map(arrival => ({ arrivesAt: new Date(arrival.arrivesAt), bike: arrival.bike ?? null }))
		.filter(arrival => Number.isFinite(arrival.arrivesAt.getTime()));
}