import { dev } from '$app/environment';
import { accountInfo, currentTrip, stations, token, tripRating, type StationInfo } from '$lib/state';
import { CapacitorHttp, type HttpResponse } from '@capacitor/core';
import { get } from 'svelte/store';
import { Preferences } from '@capacitor/preferences';
import type { GiraApiInterface, M, Q, ThrownError } from '.';
import type { Mutation, Query } from './types';
const RETRY_DELAY = 1000;
const RETRIES = 5;

export class GiraApi implements GiraApiInterface {
	backoff:number;

	constructor() {
		this.backoff = 1000;
	}

	async #mutate<T extends(keyof Mutation)[]>(body:any): Promise<M<T>> {
		let res: HttpResponse = { status: 0, data: {}, headers: {}, url: '' };
		for (let tryNum = 0; tryNum < RETRIES; tryNum++) {
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
				this.backoff = RETRY_DELAY;
				return res.data.data as Promise<M<T>>;
			} else {
				console.debug('error in mutate', res);
			}
			await new Promise(resolve => setTimeout(resolve, this.backoff += 1000));
		}
		console.error('failed mutation with body', body, res);
		throw {
			errors: res.data.errors,
			status: res.status,
		} as ThrownError;
	}

	async #query<T extends(keyof Query)[]>(body:any): Promise<Q<T>> {
		let res: HttpResponse = { status: 0, data: {}, headers: {}, url: '' };
		for (let tryNum = 0; tryNum < RETRIES; tryNum++) {
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
				this.backoff = RETRY_DELAY;
				return res.data.data as Promise<Q<T>>;
			} else {
				console.debug('error in query', res);
			}
			await new Promise(resolve => setTimeout(resolve, this.backoff += 1000));
		}
		console.error('failed query with body', body, res);
		throw {
			errors: res.data.errors,
			status: res.status,
		} as ThrownError;
	}

	// async getStations(): Promise<Q<['getStations']>> {
	// 	const req = this.query<['getStations']>({
	// 		'operationName': 'getStations',
	// 		'variables': {},
	// 		'query': 'query getStations {getStations {code, description, latitude, longitude, name, bikes, docks, serialNumber, assetStatus }}',
	// 	});
	// 	return req;
	// }

	// async updateStations() {
	// 	this.getStations().then(this.ingestStations);
	// }

	#ingestStations(maybeStations:Q<['getStations']>) {
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
	}

	getStationInfo(stationId: string): Promise<Q<['getBikes', 'getDocks']>> {
		const req = this.#query<['getBikes', 'getDocks']>({
			'variables': { input: stationId },
			'query': `query { 
				getBikes(input: "${stationId}") { battery, code, name, kms, serialNumber, type, parent }
				getDocks(input: "${stationId}") { ledStatus, lockStatus, serialNumber, code, name }
		}`,
		});
		return req;
	}

	// async getBikes(stationId: string): Promise<Q<['getBikes']>> {
	// 	const req = this.query<['getBikes']>({
	// 		'variables': { input: stationId },
	// 		'query': `query ($input: String) { getBikes(input: $input) { type, kms, battery, serialNumber, assetType, assetStatus, assetCondition, parent, warehouse, zone, location, latitude, longitude, code, name, description, creationDate, createdBy, updateDate, updatedBy, defaultOrder, version }}`,
	// 	});
	// 	return req;
	// }

	// async getDocks(stationId: string): Promise<Q<['getDocks']>> {
	// 	const req = this.query<['getDocks']>({
	// 		'variables': { input: stationId },
	// 		'query': `query ($input: String) { getDocks(input: $input) { ledStatus, lockStatus, serialNumber, assetType, assetStatus, assetCondition, parent, warehouse, zone, location, latitude, longitude, code, name, description, creationDate, createdBy, updateDate, updatedBy, defaultOrder, version }}`,
	// 	});
	// 	return req;
	// }

	async reserveBike(serialNumber: string) {
		if (dev && (await Preferences.get({ key: 'settings/mockUnlock' })).value === 'true') {
			console.debug('mock reserveBike');
			return { reserveBike: true };
		} else {
			const req = this.#mutate<['reserveBike']>({
				'variables': { input: serialNumber },
				'query': `mutation ($input: String) { reserveBike(input: $input) }`,
			});
			return req;
		}
	}

	async cancelBikeReserve() {
		const req = this.#mutate<['cancelBikeReserve']>({
			'variables': {},
			'query': `mutation { cancelBikeReserve }`,
		});
		return req;
	}

	async startTrip() {
		if (dev && (await Preferences.get({ key: 'settings/mockUnlock' })).value === 'true') {
			console.debug('mock startTrip');
			await new Promise(resolve => setTimeout(resolve, 2000));
			return { startTrip: true };
		} else {
			const req = this.#mutate<['startTrip']>({
				'variables': {},
				'query': `mutation { startTrip }`,
			});
			return req;
		}
	}
	// // returns an int or float of the active trip cost
	// async  get_active_trip_cost(){
	//     response = await make_post_request("https://apigira.emel.pt/graphql", JSON.stringify({
	//         "operationName": "activeTripCost",
	//         "variables": {},
	//         "query": "query activeTripCost {activeTripCost}"
	//     }), user.accessToken)
	//     return response.data.activeTripCost
	// }

	// async getActiveTripCost() {
	// 	const req = this.#query<['activeTripCost']>({
	// 		'variables': {},
	// 		'query': `query { activeTripCost }`,
	// 	});
	// 	return req;
	// }

	// async getPointsAndBalance() {
	// 	const req = this.#query<['client']>({
	// 		'variables': {},
	// 		'query': `query { client { balance, bonus } }`,
	// 	});
	// 	return req;
	// }

	// async updateAccountInfo() {
	// 	this.getPointsAndBalance().then(this.ingestAccountInfo);
	// }

	#ingestAccountInfo(maybePointsAndBalance:Q<['client']>) {
		if (maybePointsAndBalance.client === null || maybePointsAndBalance.client === undefined || maybePointsAndBalance.client.length <= 0) return;
		const { balance, bonus } = maybePointsAndBalance.client[0]!;
		if (balance === null || balance === undefined || bonus === null || bonus === undefined) return;
		accountInfo.update(ai => (
			{ subscription: ai?.subscription ?? null, balance, bonus }
		));
	}

	// async getSubscriptions() {
	// 	const req = this.#query<['activeUserSubscriptions']>({
	// 		'variables': {},
	// 		'query': `query { activeUserSubscriptions { expirationDate subscriptionStatus name type active } }`,
	// 	});
	// 	return req;
	// }

	// async updateSubscriptions() {
	// 	this.getSubscriptions().then(this.#ingestSubscriptions);
	// }

	async #ingestSubscriptions(maybeSubscriptions:Q<['activeUserSubscriptions']>) {
		if (maybeSubscriptions.activeUserSubscriptions === null || maybeSubscriptions.activeUserSubscriptions === undefined || maybeSubscriptions.activeUserSubscriptions.length <= 0) return;
		const { active, expirationDate, name, subscriptionStatus, type } = maybeSubscriptions.activeUserSubscriptions[0]!;
		accountInfo.update(ai => (
			{ balance: ai?.balance ?? 0, bonus: ai?.bonus ?? 0, subscription: { active: active!, expirationDate: new Date(expirationDate), name: name!, subscriptionStatus: subscriptionStatus!, type: type ?? 'unknown' } }
		));
	}

	async getTrip(tripCode:string) {
		const req = this.#query<['getTrip']>({
			'variables': { input: tripCode },
			'query': `query ($input: String) { getTrip(input: $input) { user, asset, startDate, endDate, startLocation, endLocation, distance, rating, photo, cost, startOccupation, endOccupation, totalBonus, client, costBonus, comment, compensationTime, endTripDock, tripStatus, code, name, description, creationDate, createdBy, updateDate, updatedBy, defaultOrder, version } }`,
		});
		return req;
	}

	async getActiveTripInfo() {
		const req = this.#query<['activeTrip']>({
			'variables': {},
			'query': `query { activeTrip { user, startDate, endDate, startLocation, endLocation, distance, rating, photo, cost, startOccupation, endOccupation, totalBonus, client, costBonus, comment, compensationTime, endTripDock, tripStatus, code, name, description, creationDate, createdBy, updateDate, updatedBy, defaultOrder, version } }`,
		});
		return req;
	}

	#ingestActiveTripInfo(maybeTrips:Q<['activeTrip']>) {
		if (maybeTrips.activeTrip === null || maybeTrips.activeTrip === undefined || maybeTrips.activeTrip.code === 'no_trip' || maybeTrips.activeTrip.asset === 'dummy') {
			if (get(currentTrip)?.confirmed || Date.now() - (get(currentTrip)?.startDate?.getTime() ?? 0) > 30000) {
				currentTrip.set(null);
			}
			return;
		}
		const {
		// asset,
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
			traveledDistanceKm: ct.traveledDistanceKm,
			distanceLeft: ct.distanceLeft,
			speed: ct.speed,
			startDate: new Date(startDate!),
			predictedEndDate: ct.predictedEndDate,
			arrivalTime: ct.predictedEndDate,
			finished: false,
			confirmed: true,
			pathTaken: ct.pathTaken,
		} : {
			code: code!,
			bikePlate: null,
			startPos: null,
			destination: null,
			traveledDistanceKm: 0,
			distanceLeft: null,
			speed: 0,
			startDate: new Date(startDate!),
			predictedEndDate: null,
			arrivalTime: null,
			finished: false,
			confirmed: true,
			pathTaken: [],
		});
	}

	async getTripHistory(pageNum:number, pageSize:number) {
		const req = this.#query<['tripHistory']>({
			'variables': { input: { _pageNum: pageNum, _pageSize: pageSize } },
			'query': `query ($input: PageInput) { tripHistory(pageInput: $input) { code, startDate, endDate, rating, bikeName, startLocation, endLocation, bonus, usedPoints, cost, bikeType } }`,
		});
		return req;
	}

	async getUnratedTrips(pageNum:number, pageSize:number) {
		const req = this.#query<['unratedTrips']>({
			'variables': { input: { _pageNum: pageNum, _pageSize: pageSize } },
			'query': `query ($input: PageInput) { unratedTrips(pageInput: $input) { code, startDate, endDate, rating, startLocation, endLocation, cost, costBonus, asset } }`,
		});
		return req;
	}

	async updateLastUnratedTrip() {
		const q = `query ($input: PageInput) { unratedTrips(pageInput: $input) { code, startDate, endDate, rating, startLocation, endLocation, cost, costBonus, asset }
	tripHistory(pageInput: $input) { code, startDate, endDate, rating, bikeName, startLocation, endLocation, bonus, usedPoints, cost, bikeType } }`;

		const req = await this.#query<['unratedTrips', 'tripHistory']>({
			'variables': { input: { _pageNum: 0, _pageSize: 1 } },
			'query': q,
		});
		this.#ingestLastUnratedTrip(req);
	}

	#ingestLastUnratedTrip(lastTripData:Q<['unratedTrips', 'tripHistory']>) {
		if (lastTripData.unratedTrips === null || lastTripData.unratedTrips === undefined || lastTripData.unratedTrips.length <= 0) return;
		const unratedTrip = lastTripData.unratedTrips[0];
		if (unratedTrip == null || unratedTrip.code == null || unratedTrip.asset == null) return;
		const endToNow = (new Date).getTime() - new Date(unratedTrip.endDate).getTime();
		// check if 24h have passed
		if (!(endToNow < 24 * 60 * 60 * 1000)) return;
		let bikePlate;
		if (lastTripData.tripHistory !== null && lastTripData.tripHistory !== undefined && lastTripData.tripHistory.length > 0) {
			const lastTrip = lastTripData.tripHistory[0];
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
	}

	// input RateTrip_In {
	//   code: String
	//   rating: Int
	//   description: String
	//   attachment: Attachment
	// }
	async rateTrip(tripCode:string, tripRating:number, tripComment?:string, tripAttachment?:File) {
		if (tripComment === undefined) tripComment = '';
		const actualAttachment = tripAttachment === undefined ? null : tripAttachment;
		const req = this.#mutate<['rateTrip']>({
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

	async tripPayWithNoPoints(tripCode: string) {
		const req = this.#mutate<['tripPayWithNoPoints']>({
			'variables': { input: tripCode },
			'query': `mutation ($input: String) { tripPayWithNoPoints(input: $input) }`,
		});
		return req;
	}

	async tripPayWithPoints(tripCode:string) {
		const req = this.#mutate<['tripPayWithPoints']>({
			'variables': { input: tripCode },
			'query': `mutation ($input: String) { tripPayWithPoints(input: $input) }`,
		});
		return req;
	}

	async fullOnetimeInfo(): Promise<Q<['getStations', 'client', 'activeUserSubscriptions', 'activeTrip', 'unratedTrips', 'tripHistory']>> {
		let megaQuery = `query {`;
		megaQuery += `getStations {code, description, latitude, longitude, name, bikes, docks, serialNumber, assetStatus } `;
		megaQuery += `client { balance, bonus } `;
		megaQuery += `activeUserSubscriptions { expirationDate subscriptionStatus name type active } `;
		megaQuery += `activeTrip { user, startDate, endDate, startLocation, endLocation, distance, rating, photo, cost, startOccupation, endOccupation, totalBonus, client, costBonus, comment, compensationTime, endTripDock, tripStatus, code, name, description, creationDate, createdBy, updateDate, updatedBy, defaultOrder, version } `;
		megaQuery += `unratedTrips(pageInput: { _pageNum: 0, _pageSize: 1 }) { code, startDate, endDate, rating, startLocation, endLocation, cost, costBonus, asset } `;
		megaQuery += `tripHistory(pageInput: { _pageNum: 0, _pageSize: 1 }) { code, startDate, endDate, rating, bikeName, startLocation, endLocation, bonus, usedPoints, cost, bikeType } `;
		megaQuery += `}`;

		const req = await this.#query<['getStations', 'client', 'activeUserSubscriptions', 'activeTrip', 'unratedTrips', 'tripHistory']>({
			'variables': {},
			'query': megaQuery,
		});
		return req;
	}
}