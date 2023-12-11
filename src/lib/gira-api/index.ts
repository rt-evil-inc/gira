import { token, type StationInfo, stations } from '$lib/stores';
import type { Query } from './types';
import { get } from 'svelte/store';
import { CapacitorHttp } from '@capacitor/core';
type Q<T extends (keyof Query)[]> = {[K in T[number]]:Query[K]};

function recursivePrintObject(obj:any, depth:number = 0) {
	if (depth > 10) return;
	if (typeof obj === 'object') {
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				const element = obj[key];
				console.log(' '.repeat(depth * 2), key, element);
				recursivePrintObject(element, depth + 1);
			}
		}
	}
}

async function post<T extends(keyof Query)[]>(body:any): Promise<Q<T>> {
	return CapacitorHttp.post({
		url: 'https://apigira.emel.pt/graphql',
		headers: {
			'User-Agent': 'Gira/3.2.8 (Android 34)',
			'content-type': 'application/json',
			'authorization': `Bearer ${get(token)?.accessToken}`,
		},
		data: body,
	}).then(async res => {
		return res.data.data as Promise<Q<T>>;
	});
}

export async function getStations(): Promise<Q<['getStations']>> {
	const req = post<['getStations']>({
		'operationName': 'getStations',
		'variables': {},
		'query': 'query getStations {getStations {code, description, latitude, longitude, name, bikes, docks, serialNumber }}',
	});
	return req;
}

export async function updateStations() {
	getStations().then(maybeStations => {
		if (maybeStations.getStations === null || maybeStations.getStations === undefined) return;
		const stationsList:StationInfo[] = [];
		maybeStations.getStations.forEach(station => {
			if (station === null || station === undefined) return;
			const { code, name, description, latitude, longitude, bikes, docks, serialNumber } = station;
			if (code === null || code === undefined || name === null ||
        name === undefined || description === undefined ||
        latitude === null || latitude === undefined || longitude === null ||
        longitude === undefined || bikes === null || bikes === undefined ||
        docks === null || docks === undefined || serialNumber === null ||
        serialNumber === undefined
			) {
				console.log('invalid station', station);
				return;
			}
			stationsList.push({ code, name, description, latitude, longitude, bikes, docks, serialNumber });
		});
		stations.set(stationsList);
	});
}

export async function getStationInfo(stationId: string): Promise<Q<['getBikes', 'getDocks']>> {
	console.log('getStationInfo', stationId);
	const req = post<['getBikes', 'getDocks']>({
		'variables': { input: stationId },
		'query': `query { 
				getBikes(input: "${stationId}") { battery, code, name, kms, serialNumber, type, parent }
				getDocks(input: "${stationId}") { ledStatus, lockStatus, serialNumber, code, name }
		}`,
	});
	return req;
}

export async function getBikes(stationId: string): Promise<Q<['getBikes']>> {
	console.log('getBikes', stationId);
	const req = post<['getBikes']>({
		'variables': { input: stationId },
		'query': `query ($input: String) { getBikes(input: $input) { type, kms, battery, serialNumber, assetType, assetStatus, assetCondition, parent, warehouse, zone, location, latitude, longitude, code, name, description, creationDate, createdBy, updateDate, updatedBy, defaultOrder, version }}`,
	});
	return req;
}

export async function getDocks(stationId: string): Promise<Q<['getDocks']>> {
	console.log('getDocks', stationId);
	const req = post<['getDocks']>({
		'variables': { input: stationId },
		'query': `query ($input: String) { getDocks(input: $input) { ledStatus, lockStatus, serialNumber, assetType, assetStatus, assetCondition, parent, warehouse, zone, location, latitude, longitude, code, name, description, creationDate, createdBy, updateDate, updatedBy, defaultOrder, version }}`,
	});
	return req;
}