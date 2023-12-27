import { dev } from '$app/environment';
import { accountInfo, currentTrip, stations, token, tripRating, type StationInfo } from '$lib/stores';
import { CapacitorHttp, type HttpResponse } from '@capacitor/core';
import { get } from 'svelte/store';
import type { Mutation, Query } from './types';
import { Preferences } from '@capacitor/preferences';
type Q<T extends (keyof Query)[]> = {[K in T[number]]:Query[K]};
type M<T extends (keyof Mutation)[]> = {[K in T[number]]:Mutation[K]};
export type ThrownError = {
	errors: {message:string}[];
	status: number;
};

const retries = 5;
const retryDelay = 1000;
let backoff = 1000;

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
			console.debug(body, res);
			backoff = retryDelay;
			return res.data.data as Promise<M<T>>;
		} else {
			console.debug('error in mutate', res);
		}
		await new Promise(resolve => setTimeout(resolve, backoff += 1000));
	}
	console.error('failed mutation with body', body, res);
	throw {
		errors: res.data.errors,
		status: res.status,
	} as ThrownError;
}
async function query<T extends(keyof Query)[]>(body:any): Promise<Q<T>> {
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
			console.debug(body, res);
			backoff = retryDelay;
			return res.data.data as Promise<Q<T>>;
		} else {
			console.debug('error in query', res);
		}
		await new Promise(resolve => setTimeout(resolve, backoff += 1000));
	}
	console.error('failed query with body', body, res);
	throw {
		errors: res.data.errors,
		status: res.status,
	} as ThrownError;
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
				console.error('invalid station', station);
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
	if (dev && (await Preferences.get({ key: 'settings/mockUnlock' })).value === 'true') {
		console.debug('mock reserveBike');
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
	if (dev && (await Preferences.get({ key: 'settings/mockUnlock' })).value === 'true') {
		console.debug('mock startTrip');
		await new Promise(resolve => setTimeout(resolve, 2000));
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

export async function getPointsAndBalance() {
	const req = query<['client']>({
		'variables': {},
		'query': `query { client { balance, bonus } }`,
	});
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
}

export async function getSubscriptions() {
	const req = query<['activeUserSubscriptions']>({
		'variables': {},
		'query': `query { activeUserSubscriptions { expirationDate subscriptionStatus name type active } }`,
	});
	return req;
}

export async function updateSubscriptions() {
	getSubscriptions().then(maybeSubscriptions => {
		if (maybeSubscriptions.activeUserSubscriptions === null || maybeSubscriptions.activeUserSubscriptions === undefined || maybeSubscriptions.activeUserSubscriptions.length <= 0) return;
		const { active, expirationDate, name, subscriptionStatus, type } = maybeSubscriptions.activeUserSubscriptions[0]!;
		accountInfo.update(ai => (
			{ balance: ai?.balance ?? 0, bonus: ai?.bonus ?? 0, subscription: { active: active!, expirationDate: new Date(expirationDate), name: name!, subscriptionStatus: subscriptionStatus!, type: type ?? 'unknown' } }
		));
	});
}

export async function getTrip(tripCode:string) {
	const req = query<['getTrip']>({
		'variables': { input: tripCode },
		'query': `query ($input: String) { getTrip(input: $input) { user, asset, startDate, endDate, startLocation, endLocation, distance, rating, photo, cost, startOccupation, endOccupation, totalBonus, client, costBonus, comment, compensationTime, endTripDock, tripStatus, code, name, description, creationDate, createdBy, updateDate, updatedBy, defaultOrder, version } }`,
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
		if (maybeTrips.activeTrip === null || maybeTrips.activeTrip === undefined || maybeTrips.activeTrip.code === 'no_trip' || maybeTrips.activeTrip.asset === 'dummy') {
			currentTrip.set(null);
			return;
		}
		const {
			asset,
			startDate,
			code,
			// user,
			// endDate,
			// startLocation,
			// endLocation,
			// rating,
			// photo,
			// cost,
			// startOccupation,
			// endOccupation,
			// totalBonus,
			// client,
			// costBonus,
			// comment,
			// compensationTime,
			// endTripDock,
			// tripStatus,
			// name,
			// description,
			// creationDate,
			// createdBy,
			// updateDate,
			// updatedBy,
			// defaultOrder,
			// version,
		} = maybeTrips.activeTrip!;
		currentTrip.update(ct => ct ? {
			code: code!,
			bikePlate: ct.bikePlate,
			startPos: ct.startPos,
			destination: ct.destination,
			travelledDistanceKm: ct.travelledDistanceKm,
			distanceLeft: ct.distanceLeft,
			speed: ct.speed,
			startDate: new Date(startDate!),
			predictedEndDate: ct.predictedEndDate,
			arrivalTime: ct.predictedEndDate,
			finished: false,
			pathTaken: ct.pathTaken,
		} : {
			code: code!,
			bikePlate: null,
			startPos: null,
			destination: null,
			travelledDistanceKm: 0,
			distanceLeft: null,
			speed: 0,
			startDate: new Date(startDate!),
			predictedEndDate: null,
			arrivalTime: null,
			finished: false,
			pathTaken: [],
		});
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

export async function getUnratedTrips(pageNum:number, pageSize:number) {
	const req = query<['unratedTrips']>({
		'variables': { input: { _pageNum: pageNum, _pageSize: pageSize } },
		'query': `query ($input: PageInput) { unratedTrips(pageInput: $input) { code, startDate, endDate, rating, startLocation, endLocation, cost, costBonus, asset } }`,
	});
	return req;
}

export async function updateLastUnratedTrip() {
	return Promise.all([getUnratedTrips(0, 1), getTripHistory(0, 1)]).then(([maybeTrips, history]) => {
		if (maybeTrips.unratedTrips === null || maybeTrips.unratedTrips === undefined || maybeTrips.unratedTrips.length <= 0) return;
		const unratedTrip = maybeTrips.unratedTrips[0];
		if (unratedTrip == null || unratedTrip.code == null || unratedTrip.asset == null) return;
		const endToNow = (new Date).getTime() - new Date(unratedTrip.endDate).getTime();
		// check if 24h have passed
		if (!(endToNow < 24 * 60 * 60 * 1000)) return;
		let bikePlate;
		if (history.tripHistory !== null && history.tripHistory !== undefined && history.tripHistory.length > 0) {
			const lastTrip = history.tripHistory[0];
			if (lastTrip) {
				const lastTripCode = lastTrip?.code;
				bikePlate = lastTrip.bikeName;
				if (lastTripCode !== unratedTrip.code) return;
			}
		}

		tripRating.set({
			currentRating: {
				code: unratedTrip.code,
				// probably have to translate asset to bike id
				bikePlate: bikePlate ?? '???',
				startDate: new Date(unratedTrip.startDate),
				endDate: new Date(unratedTrip.endDate),
				tripPoints: unratedTrip.costBonus || 0,
			},
		});
	});
}

// input RateTrip_In {
//   code: String
//   rating: Int
//   description: String
//   attachment: Attachment
// }
export async function rateTrip(tripCode:string, tripRating:number, tripComment?:string, tripAttachment?:File) {
	if (tripComment === undefined) tripComment = '';
	const actualAttachment = tripAttachment === undefined ? null : tripAttachment;
	const req = mutate<['rateTrip']>({
		'variables': {
			in: {
				code: tripCode,
				rating: tripRating,
				description: tripComment,
				attachment: actualAttachment !== null ? {
					bytes: actualAttachment?.arrayBuffer() ?? null,
					fileName: `img_${tripCode}.png`,
					mimeType: 'image/png',
				} : null,
			},
		},
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
export async function tripPayWithPoints(tripCode:string) {
	const req = mutate<['tripPayWithPoints']>({
		'variables': { input: tripCode },
		'query': `mutation ($input: String) { tripPayWithPoints(input: $input) }`,
	});
	return req;
}