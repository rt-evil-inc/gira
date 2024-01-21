import type { Q } from '$lib/gira-api';
import { get } from 'svelte/store';
import { stations, type StationInfo, tripRating, currentTrip, accountInfo } from '.';

export function ingestStations(maybeStations:Q<['getStations']>) {
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

export function ingestAccountInfo(maybePointsAndBalance:Q<['client']>) {
	if (maybePointsAndBalance.client === null || maybePointsAndBalance.client === undefined || maybePointsAndBalance.client.length <= 0) return;
	const { balance, bonus } = maybePointsAndBalance.client[0]!;
	if (balance === null || balance === undefined || bonus === null || bonus === undefined) return;
	accountInfo.update(ai => (
		{ subscription: ai?.subscription ?? null, balance, bonus }
	));
}

export async function ingestSubscriptions(maybeSubscriptions:Q<['activeUserSubscriptions']>) {
	if (maybeSubscriptions.activeUserSubscriptions === null || maybeSubscriptions.activeUserSubscriptions === undefined || maybeSubscriptions.activeUserSubscriptions.length <= 0) return;
	const { active, expirationDate, name, subscriptionStatus, type } = maybeSubscriptions.activeUserSubscriptions[0]!;
	accountInfo.update(ai => (
		{ balance: ai?.balance ?? 0, bonus: ai?.bonus ?? 0, subscription: { active: active!, expirationDate: new Date(expirationDate), name: name!, subscriptionStatus: subscriptionStatus!, type: type ?? 'unknown' } }
	));
}

export function ingestActiveTripInfo(maybeTrips:Q<['activeTrip']>) {
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
export function ingestLastUnratedTrip(lastTripData:Q<['unratedTrips', 'tripHistory']>) {
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