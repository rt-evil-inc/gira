import { Preferences } from '@capacitor/preferences';
import { get, writable, type Writable } from 'svelte/store';
import { login, refreshToken, updateUserInfo } from './auth';
import { updateOnetimeInfo } from './gira-api';
import { startWS, ws } from './gira-api/ws';
import { currentPos } from './location';
import { distanceBetweenCoords } from './utils';

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
	bikePlate: string|null,
	startPos: {lat: number, lng: number}|null,
	destination: {lat: number, lng: number}|null,
	traveledDistanceKm: number,
	distanceLeft: number|null,
	speed: number,
	startDate: Date,
	predictedEndDate: Date|null,
	arrivalTime: Date|null,
	finished: boolean,
	pathTaken : {lat: number, lng: number, time:Date}[]
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
	mockUnlock: boolean;
	backgroundLocation: boolean;
}
export type TripRating = {
	currentRating:{
		code:string,
		bikePlate:string|null,
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
export const appSettings = writable<AppSettings>({ distanceLock: true, mockUnlock: true, backgroundLocation: true });
export const tripRating = writable<TripRating>({ currentRating: null });

export const errorMessages:Writable<{msg:string, id:number}[]> = writable([]);
export function addErrorMessage(msg:string, delay = 3000) {
	const id = Math.random();
	errorMessages.update(messages => {
		messages.push({ msg, id });
		return messages;
	});
	setTimeout(() => removeErrorMessage(id), delay);
	return id;
}
export function removeErrorMessage(id:number) {
	errorMessages.update(messages => {
		return messages.filter(m => m.id !== id);
	});
}

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

	if (!ws || ws.readyState === ws.CLOSED) startWS();
	if (get(user) === null) {
		updateOnetimeInfo();
		updateUserInfo();
	}

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
	const distanceLock = (await Preferences.get({ key: 'settings/distanceLock' })).value !== 'false'; // !== 'false' is so that it defaults to true if the key is not set
	const mockUnlock = (await Preferences.get({ key: 'settings/mockUnlock' })).value !== 'false';
	const backgroundLocation = (await Preferences.get({ key: 'settings/backgroundLocation' })).value !== 'false';
	appSettings.set({ distanceLock, mockUnlock, backgroundLocation });

	userCredentials.subscribe(async v => {
		if (!v) {
			Preferences.remove({ key: 'email' });
			Preferences.remove({ key: 'password' });
			return;
		}
		const responseCode = await login(v.email, v.password);
		if (responseCode !== 0) {
			console.error('Login failed!');
			userCredentials.set(null);
		}
		Preferences.set({ key: 'email', value: v.email });
		Preferences.set({ key: 'password', value: v.password });
	});
	appSettings.subscribe(async v => {
		Preferences.set({ key: 'settings/distanceLock', value: v.distanceLock.toString() });
		Preferences.set({ key: 'settings/mockUnlock', value: v.mockUnlock.toString() });
		Preferences.set({ key: 'settings/backgroundLocation', value: v.backgroundLocation.toString() });
	});
}
currentPos.subscribe(async v => {
	if (!v) return;
	currentTrip.update(trip => {
		if (!trip) return trip;
		trip.pathTaken.push({ lat: v.coords.latitude, lng: v.coords.longitude, time: new Date(v.timestamp) });

		if (trip.pathTaken.length > 1) {
			const lastLocation = trip.pathTaken[trip.pathTaken.length - 2];
			const traveledDistance = distanceBetweenCoords(lastLocation.lat, lastLocation.lng, v.coords.latitude, v.coords.longitude);
			trip.traveledDistanceKm += traveledDistance;
			const speed = (trip.traveledDistanceKm / ((v.timestamp - trip.startDate.getTime()) / 1000)) * 3600;
			trip.speed = speed;
		}
		return trip;
	});
});

export async function logOut() {
	token.set(null);
	userCredentials.set(null);
	accountInfo.set(null);
	currentTrip.set(null);
	user.set(null);
	selectedStation.set(null);
	// purposefully not settings settings distancelock, since thats annoying when you swap accounts
}