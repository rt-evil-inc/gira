import { token, type StationInfo, stations, accountInfo, currentTrip } from '$lib/stores';
import type { Mutation, Query } from './types';
import { get } from 'svelte/store';
import { CapacitorHttp, type HttpResponse } from '@capacitor/core';
import { dev } from '$app/environment';
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
		if (res.status >= 200 && res.status < 300) {
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
		console.log(res);
		return res.data.data as Promise<Q<T>>;
	});
}

export async function getStations(): Promise<Q<['getStations']>> {
	const req = query<['getStations']>({
		'operationName': 'getStations',
		'variables': {},
		'query': 'query getStations {getStations {code, description, latitude, longitude, name, bikes, docks, serialNumber, assetStatus }}',
	});
	return req;
}

export async function updateStations() {
	getStations().then(maybeStations => {
		if (maybeStations.getStations === null || maybeStations.getStations === undefined) return;
		const stationsList:StationInfo[] = [];
		maybeStations.getStations.forEach(station => {
			if (station === null || station === undefined) return;
			const { code, name, description, latitude, longitude, bikes, docks, serialNumber, assetStatus } = station;
			if (code === null || code === undefined || name === null ||
        name === undefined || description === undefined ||
        latitude === null || latitude === undefined || longitude === null ||
        longitude === undefined || bikes === null || bikes === undefined ||
        docks === null || docks === undefined || serialNumber === null ||
        serialNumber === undefined || assetStatus === null || assetStatus === undefined
			) {
				console.log('invalid station', station);
				return;
			}
			stationsList.push({ code, name, description, latitude, longitude, bikes, docks, serialNumber, assetStatus });
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
	const req = query<['getBikes']>({
		'variables': { input: stationId },
		'query': `query ($input: String) { getBikes(input: $input) { type, kms, battery, serialNumber, assetType, assetStatus, assetCondition, parent, warehouse, zone, location, latitude, longitude, code, name, description, creationDate, createdBy, updateDate, updatedBy, defaultOrder, version }}`,
	});
	return req;
}

export async function getDocks(stationId: string): Promise<Q<['getDocks']>> {
	const req = query<['getDocks']>({
		'variables': { input: stationId },
		'query': `query ($input: String) { getDocks(input: $input) { ledStatus, lockStatus, serialNumber, assetType, assetStatus, assetCondition, parent, warehouse, zone, location, latitude, longitude, code, name, description, creationDate, createdBy, updateDate, updatedBy, defaultOrder, version }}`,
	});
	return req;
}

export async function reserveBike(serialNumber: string) {
	if (dev) {
		console.log('mock reserveBike');
		return { reserveBike: true };
	} else {
		const req = mutate<['reserveBike']>({
			'variables': { input: serialNumber },
			'query': `mutation ($input: String) { reserveBike(input: $input) }`,
		});
		return req;
	}
}

export async function cancelBikeReserve() {
	const req = mutate<['cancelBikeReserve']>({
		'variables': {},
		'query': `mutation { cancelBikeReserve }`,
	});
	return req;
}

export async function startTrip() {
	if (dev) {
		console.log('mock startTrip');
		return { startTrip: true };
	} else {
		const req = mutate<['startTrip']>({
			'variables': {},
			'query': `mutation { startTrip }`,
		});
		return req;
	}
}
// // returns an int or float of the active trip cost
// async function get_active_trip_cost(){
//     response = await make_post_request("https://apigira.emel.pt/graphql", JSON.stringify({
//         "operationName": "activeTripCost",
//         "variables": {},
//         "query": "query activeTripCost {activeTripCost}"
//     }), user.accessToken)
//     return response.data.activeTripCost
// }

export async function getActiveTripCost() {
	const req = query<['activeTripCost']>({
		'variables': {},
		'query': `query { activeTripCost }`,
	});
	return req;
}

export async function getActiveTrip() {
	const req = query<['activeTrip']>({
		'variables': {},
		'query': `query { activeTrip { code, startDate, endDate, cost, client, tripStatus, version } }`,
	});
	return req;
}

export async function rateTrip(tripCode: string, tripRating: number, tripComment: string) {
	const req = mutate<['rateTrip']>({
		'variables': { in: { code: tripCode, rating: tripRating, description: '', attachment: { bytes: null, fileName: `img_${tripCode}.png`, mimeType: 'image/png' } } },
		'query': `mutation ($in: RateTrip_In) { rateTrip(in: $in) }`,
	});
	return req;
}

export async function tripPayWithNoPoints(tripCode: string) {
	const req = mutate<['tripPayWithNoPoints']>({
		'variables': { input: tripCode },
		'query': `mutation ($input: String) { tripPayWithNoPoints(input: $input) }`,
	});
	return req;
}

export async function tripPayWithPoints(tripCode: string) {
	const req = mutate<['tripPayWithPoints']>({
		'variables': { input: tripCode },
		'query': `mutation ($input: String) { tripPayWithPoints(input: $input) }`,
	});
	return req;
}
export async function getPointsAndBalance() {
	const req = query<['client']>({
		'variables': {},
		'query': `query { client { balance, bonus } }`,
	});
	// console.log(req);
	return req;
}

export async function updateAccountInfo() {
	getPointsAndBalance().then(maybePointsAndBalance => {
		if (maybePointsAndBalance.client === null || maybePointsAndBalance.client === undefined || maybePointsAndBalance.client.length <= 0) return;
		const { balance, bonus } = maybePointsAndBalance.client[0]!;
		if (balance === null || balance === undefined || bonus === null || bonus === undefined) return;
		accountInfo.update(ai => (
			{ subscription: ai?.subscription ?? null, balance, bonus }
		));
	});
	// console.log('client', maybeClient.client);
}

export async function getSubscriptions() {
	const req = query<['activeUserSubscriptions']>({
		'variables': {},
		'query': `query { activeUserSubscriptions { expirationDate subscriptionStatus name type active } }`,
	});
	// console.log(req);
	return req;
}

export async function updateSubscriptions() {
	getSubscriptions().then(maybeSubscriptions => {
		if (maybeSubscriptions.activeUserSubscriptions === null || maybeSubscriptions.activeUserSubscriptions === undefined || maybeSubscriptions.activeUserSubscriptions.length <= 0) return;
		// console.log(maybeSubscriptions.activeUserSubscriptions);
		const { active, expirationDate, name, subscriptionStatus, type } = maybeSubscriptions.activeUserSubscriptions[0]!;
		accountInfo.update(ai => (
			{ balance: ai?.balance ?? 0, bonus: ai?.bonus ?? 0, subscription: { active: active!, expirationDate: new Date(expirationDate), name: name!, subscriptionStatus: subscriptionStatus!, type: type ?? 'unknown' } }
		));
	});
}

export async function getTrip(tripCode:string) {
	const req = query<['getTrip']>({
		'variables': { input: tripCode },
		'query': `query ($input: String) { getTrip { user, asset, startDate, endDate, startLocation, endLocation, distance, rating, photo, cost, startOccupation, endOccupation, totalBonus, client, costBonus, comment, compensationTime, endTripDock, tripStatus, code, name, description, creationDate, createdBy, updateDate, updatedBy, defaultOrder, version } }`,
	});
	return req;
}

export async function getActiveTripInfo() {
	const req = query<['activeTrip']>({
		'variables': {},
		'query': `query { activeTrip { user, asset, startDate, endDate, startLocation, endLocation, distance, rating, photo, cost, startOccupation, endOccupation, totalBonus, client, costBonus, comment, compensationTime, endTripDock, tripStatus, code, name, description, creationDate, createdBy, updateDate, updatedBy, defaultOrder, version } }`,
	});
	return req;
}

export async function updateActiveTripInfo() {
	getActiveTripInfo().then(maybeTrips => {
		if (maybeTrips.activeTrip === null || maybeTrips.activeTrip === undefined) return;
		const {
			user,
			asset,
			startDate,
			endDate,
			startLocation,
			endLocation,
			distance,
			rating,
			photo,
			cost,
			startOccupation,
			endOccupation,
			totalBonus,
			client,
			costBonus,
			comment,
			compensationTime,
			endTripDock,
			tripStatus,
			code,
			name,
			description,
			creationDate,
			createdBy,
			updateDate,
			updatedBy,
			defaultOrder,
			version,
		} = maybeTrips.activeTrip!;
		if (code === 'no_trip') return;
		currentTrip.update(_ => (
			{
				code: code!,
				bikeId: asset!,
				startPos: null,
				destination: null,
				distance: distance!,
				distanceLeft: null,
				speed: 0,
				startDate: new Date(startDate!),
				predictedEndDate: new Date(endDate!),
				arrivalTime: null,
				finished: false,
			}
		));
	});
}
//
// tripHistory(pageInput: PageInput): [TripHistory_TripDetail]

// input PageInput {
//   _pageNum: Int
//   _pageSize: Int
// }

//type TripHistory_TripDetail {
//   code: String
//   startDate: DateTime
//   endDate: DateTime
//   rating: Int
//   bikeName: String
//   startLocation: String
//   endLocation: String
//   bonus: Int
//   usedPoints: Int
//   cost: Float
//   bikeType: String
// }

export async function getTripHistory(pageNum:number, pageSize:number) {
	const req = query<['tripHistory']>({
		'variables': { input: { _pageNum: pageNum, _pageSize: pageSize } },
		'query': `query ($input: PageInput) { tripHistory(pageInput: $input) { code, startDate, endDate, rating, bikeName, startLocation, endLocation, bonus, usedPoints, cost, bikeType } }`,
	});
	return req;
}