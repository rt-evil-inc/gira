import { token, type StationInfo, stations } from '$lib/stores';
import type { Mutation, Query } from './types';
import { get } from 'svelte/store';
import { CapacitorHttp, type HttpResponse } from '@capacitor/core';
type Q<T extends (keyof Query)[]> = {[K in T[number]]:Query[K]};
type M<T extends (keyof Mutation)[]> = {[K in T[number]]:Mutation[K]};

const retries = 3;

async function mutate<T extends(keyof Mutation)[]>(body:any): Promise<M<T>> {
	let res: HttpResponse = { status: 0, data: {}, headers: {}, url: '' };
	for (let tryNum = 0; tryNum < retries; tryNum++) {
		res = await CapacitorHttp.post({
			url: 'https://apigira.emel.pt/graphql',
			headers: {
				'User-Agent': 'Gira/3.2.8 (Android 34)',
				'content-type': 'application/json',
				'authorization': `Bearer ${get(token)?.accessToken}`,
			},
			data: body,
		});
		console.log(res);
		if (res.status >= 200 && res.status < 300) {
			console.log(res.status);
			return res.data.data as Promise<M<T>>;
		}
	}
	throw new Error(res.data.errors || res.status);
}
async function query<T extends(keyof Query)[]>(body:any): Promise<Q<T>> {
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
	const req = query<['getStations']>({
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
	const req = query<['getBikes', 'getDocks']>({
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
	const req = query<['getBikes']>({
		'variables': { input: stationId },
		'query': `query ($input: String) { getBikes(input: $input) { type, kms, battery, serialNumber, assetType, assetStatus, assetCondition, parent, warehouse, zone, location, latitude, longitude, code, name, description, creationDate, createdBy, updateDate, updatedBy, defaultOrder, version }}`,
	});
	return req;
}

export async function getDocks(stationId: string): Promise<Q<['getDocks']>> {
	console.log('getDocks', stationId);
	const req = query<['getDocks']>({
		'variables': { input: stationId },
		'query': `query ($input: String) { getDocks(input: $input) { ledStatus, lockStatus, serialNumber, assetType, assetStatus, assetCondition, parent, warehouse, zone, location, latitude, longitude, code, name, description, creationDate, createdBy, updateDate, updatedBy, defaultOrder, version }}`,
	});
	return req;
}

export async function reserveBike(serialNumber: string) {
	const req = mutate<['reserveBike']>({
		'variables': { input: serialNumber },
		'query': `mutation ($input: String) { reserveBike(input: $input) }`,
	});
	return req;
}

export async function cancelBikeReserve() {
	const req = mutate<['cancelBikeReserve']>({
		'variables': {},
		'query': `mutation { cancelBikeReserve }`,
	});
	return req;
}

export async function startTrip() {
	console.log('mock startTrip');
	// const req = mutate<['startTrip']>({
	// 	'variables': {},
	// 	'query': `mutation { startTrip }`,
	// });
	// return req;
}