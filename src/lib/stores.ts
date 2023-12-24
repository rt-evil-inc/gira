import { writable, type Writable } from 'svelte/store';
import { login, refreshToken, updateUserInfo } from './auth';
import { updateAccountInfo, updateStations, updateSubscriptions, updateActiveTripInfo, getTripHistory, getTrip, getUnratedTrips, updateLastUnratedTrip } from './gira-api';
import { Preferences } from '@capacitor/preferences';
import { startWS } from './gira-api/ws';

export type User = {
	email: string;
	name: string;
}
export type Token = {
  accessToken: string;
	refreshToken: string;
	expiration: number;
};

export type StationInfo ={
	code: string;
	name: string;
	description: string|null;
	latitude: number;
	longitude: number;
	bikes: number;
	docks: number;
	serialNumber: string;
	assetStatus: string;
};
// const k = await Preferences.get({ key: 'email' });

// let destination:boolean, bike:string, time:string, distance:string, speed:string, distanceLeft:string, timeLeft:string, arrivalTime:string;
export type ActiveTrip = {
	code: string,
	bikeId: string,
	startPos: {lat: number, lng: number}|null,
	destination: {lat: number, lng: number}|null,
	distance: number,
	distanceLeft: number|null,
	speed: number,
	startDate: Date,
	predictedEndDate: Date|null,
	arrivalTime: Date|null,
	finished: boolean,
}

export type AccountInfo = {
	bonus: number;
	balance: number;
	subscription: Subscription|null;
}
export type Subscription = {
	active: boolean;
	expirationDate: Date;
	name: string;
	subscriptionStatus: string;
	type:string
}
export type Insets = {
	top: number;
	bottom: number;
	left: number;
	right: number;
}
export type AppSettings = {
	distanceLock: boolean;
}
export type TripRating = {
	currentRating:{
		code:string,
		bikeId:string,
		startDate:Date,
		endDate:Date,
		tripPoints:number,
	}|null,
}

export const userCredentials: Writable<{email: string, password: string}|null> = writable(null);
export const token: Writable<Token|null|undefined> = writable(undefined);
export const user: Writable<User|null> = writable(null);
export const stations = writable<StationInfo[]>([]);
export const currentTrip = writable<ActiveTrip|null>(null);
export const accountInfo = writable<AccountInfo|null>(null);
export const selectedStation = writable<string|null>(null);
export const safeInsets = writable<Insets>({ top: 0, bottom: 0, left: 0, right: 0 });
export const appSettings = writable<AppSettings>({ distanceLock: true });
export const tripRating = writable<TripRating>({ currentRating: null });
export const errorMessage = writable<string|null>(null);

type JWT = {
	jti: string;
	sub: string;
	loginProvider: string;
	services: string[];
	nbf: number;
	exp: number;
	iat: number;
	iss: string;
	aud: string;
};
let tokenRefreshTimeout: ReturnType<typeof setTimeout>|null = null;
token.subscribe(async v => {
	if (!v) return;
	const jwt:JWT = JSON.parse(window.atob(v.accessToken.split('.')[1]));

	startWS();
	updateUserInfo();
	updateStations();
	updateAccountInfo();
	updateSubscriptions();
	updateActiveTripInfo();
	updateLastUnratedTrip();
	if (tokenRefreshTimeout) clearTimeout(tokenRefreshTimeout);
	tokenRefreshTimeout = setTimeout(refreshToken, jwt.exp * 1000 - Date.now() - 1000 * 30);
});

export async function loadUserCreds() {
	const email = (await Preferences.get({ key: 'email' })).value;
	const password = (await Preferences.get({ key: 'password' })).value;
	if (email && password) {
		userCredentials.set({ email, password });
	} else {
		// This is here to show the login dialog if there are no credentials set
		token.set(null);
	}
	const distanceLock = (await Preferences.get({ key: 'settings/distanceLock' })).value === 'true';
	appSettings.set({ distanceLock });

	userCredentials.subscribe(async v => {
		if (!v) {
			Preferences.remove({ key: 'email' });
			Preferences.remove({ key: 'password' });
			return;
		}
		const responseCode = await login(v.email, v.password);
		if (responseCode !== 0) {
			console.log('Login failed!');
			userCredentials.set(null);
		}
		Preferences.set({ key: 'email', value: v.email });
		Preferences.set({ key: 'password', value: v.password });
	});
	appSettings.subscribe(async v => {
		Preferences.set({ key: 'settings/distanceLock', value: v.distanceLock.toString() });
	});
}

export async function logOut() {
	token.set(null);
	userCredentials.set(null);
	accountInfo.set(null);
	currentTrip.set(null);
	user.set(null);
	selectedStation.set(null);
	// purposefully not settings settings distancelock, since thats annoying when you swap accounts
}