import { writable, type Writable } from 'svelte/store';
import { getUserInfo } from './emel-api/emel-api';
import { login, refreshToken, updateUserInfo } from './auth';
import { updateStations } from './gira-api';
import { Preferences } from '@capacitor/preferences';
import { onMount } from 'svelte';

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
};
// const k = await Preferences.get({ key: 'email' });

export const userCredentials: Writable<{email: string, password: string}|null> = writable(null);
export const token: Writable<Token|null> = writable(null);
export const user: Writable<User|null> = writable(null);
export const stations = writable<StationInfo[]>([]);

export const loadingTasks:Writable<Set<number>> = writable(new Set);
export function addLoadingTask() {
	const rnd = Math.random();
	loadingTasks.update(tasks => tasks.add(rnd));
	return rnd;
}
export function removeLoadingTask(id: number) {
	loadingTasks.update(tasks => {
		tasks.delete(id);
		return tasks;
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
token.subscribe(v => {
	if (v === null) return;
	const jwt:JWT = JSON.parse(window.atob(v.accessToken.split('.')[1]));
	updateUserInfo();
	updateStations();
	if (tokenRefreshTimeout) clearTimeout(tokenRefreshTimeout);
	tokenRefreshTimeout = setTimeout(refreshToken, (new Date).getMilliseconds() - 1000 + jwt.exp * 1000 - 1000 * 20);
});
userCredentials.subscribe(async v => {
	if (v === null) return;
	const responseCode = await login(v.email, v.password);
	if (responseCode !== 0) {
		console.log('login failed');
		userCredentials.set(null);
	}
	console.log('login success');
	Preferences.set({ key: 'email', value: v.email });
	Preferences.set({ key: 'password', value: v.password });
});

export async function loadUserCreds() {
	const email = (await Preferences.get({ key: 'email' })).value;
	const password = (await Preferences.get({ key: 'password' })).value;
	if (email && password) {
		userCredentials.set({ email, password });
	}
}