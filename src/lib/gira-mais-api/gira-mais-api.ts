import { dev, version } from '$app/environment';
import { GIRA_MAIS_API_URL } from '$lib/constants';
import type { MessageGetResponse, TripStatisticsPostRequest, TripStatisticsPostResponse, UsageStatisticsPostRequest, UsageStatisticsPostResponse } from '$lib/gira-mais-api/types';
import { appSettings } from '$lib/settings';
import { httpRequestWithRetry } from '$lib/utils';
import { Device } from '@capacitor/device';
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

export async function getMessage() {
	const response = await httpRequestWithRetry({
		method: 'get',
		url: GIRA_MAIS_API_URL + '/message',
		headers: {
			'User-Agent': `Gira+/${version}`,
			'Content-Type': 'application/json',
		},
	});
	return response?.data as MessageGetResponse;
}