import { writable, type Writable } from 'svelte/store';
import { getUserInfo } from './emel-api/emel-api';
import { login, updateUserInfo } from './auth';
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

token.subscribe(v => {
	if (v === null) return;
	updateUserInfo();
	updateStations();
});
userCredentials.subscribe(async v => {
	if (v === null) return;
	const success = await login(v.email, v.password);
	if (!success) {
		console.log(v.email, v.password);
		console.log('login failed');
		userCredentials.set(null);
	} else {
		console.log('login success');
	}
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