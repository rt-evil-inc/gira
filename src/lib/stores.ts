import { writable, type Writable } from 'svelte/store';
import { getUserInfo } from './emel-api/emel-api';
import { updateUserInfo } from './auth';
import { updateStations } from './gira-api';

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