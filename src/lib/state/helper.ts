import { get } from 'svelte/store';
import { token, userCredentials, accountInfo, currentTrip, user, selectedStation, tripRating } from '.';
import { ingestAccountInfo, ingestActiveTripInfo, ingestCurrentTripUpdate, ingestLastUnratedTrip, ingestOtherTripUpdate, ingestStations, ingestSubscriptions } from './mutate';
import type { ActiveTripSubscription } from '$lib/gira-api/ws-types';
import { fullOnetimeInfo, getActiveTripInfo, tripPayWithNoPoints, tripPayWithPoints } from '$lib/gira-api/api';

export async function updateOnetimeInfo() {
	const resp = await fullOnetimeInfo();
	ingestStations(resp);
	ingestAccountInfo(resp);
	ingestSubscriptions(resp);
	ingestActiveTripInfo(resp);
	ingestLastUnratedTrip(resp);
}

export function updateActiveTripInfo() {
	getActiveTripInfo().then(ingestActiveTripInfo);
}
export async function logOut() {
	token.set(null);
	userCredentials.set(null);
	accountInfo.set(null);
	currentTrip.set(null);
	user.set(null);
	selectedStation.set(null);
	tripRating.set({ currentRating: null });
	// purposefully not settings settings distancelock, since thats annoying when you swap accounts
}

export function updateWithTripMessage(recvTrip:ActiveTripSubscription) {
	console.debug('ingesting trip message from ws', recvTrip);
	if (recvTrip.code === 'no_trip' || recvTrip.bike === 'dummy') {
		if (get(currentTrip)?.confirmed || Date.now() - (get(currentTrip)?.startDate?.getTime() ?? 0) > 30000) {
			currentTrip.set(null);
		}
		return;
	}

	if (recvTrip.finished) {
		if (recvTrip.canUsePoints) tripPayWithPoints(recvTrip.code);
		else if (recvTrip.canPayWithMoney) tripPayWithNoPoints(recvTrip.code);
	}

	const ctrip = get(currentTrip);
	if (recvTrip.code === ctrip?.code) ingestCurrentTripUpdate(recvTrip);
	else ingestOtherTripUpdate(recvTrip);
}