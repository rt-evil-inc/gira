import { api } from '$lib/gira-api';
import { token, userCredentials, accountInfo, currentTrip, user, selectedStation, tripRating } from '.';
import { ingestAccountInfo, ingestActiveTripInfo, ingestLastUnratedTrip, ingestStations, ingestSubscriptions } from './mutate';

export async function updateOnetimeInfo() {
	const resp = await api.fullOnetimeInfo();
	ingestStations(resp);
	ingestAccountInfo(resp);
	ingestSubscriptions(resp);
	ingestActiveTripInfo(resp);
	ingestLastUnratedTrip(resp);
}

export function updateActiveTripInfo() {
	api.getActiveTripInfo().then(ingestActiveTripInfo);
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