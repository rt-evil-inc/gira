import { Preferences } from '@capacitor/preferences';
import { writable } from 'svelte/store';

export type AppSettings = {
	distanceLock: boolean;
	mockUnlock: boolean;
	backgroundLocation: boolean;
	analytics: boolean;
	theme: 'light'|'dark'|'system';
}

export const appSettings = writable<AppSettings>();

export async function loadSettings() {
	const distanceLock = (await Preferences.get({ key: 'settings/distanceLock' })).value !== 'false'; // !== 'false' is so that it defaults to true if the key is not set
	const mockUnlock = (await Preferences.get({ key: 'settings/mockUnlock' })).value !== 'false';
	const backgroundLocation = (await Preferences.get({ key: 'settings/backgroundLocation' })).value !== 'false';
	const analytics = (await Preferences.get({ key: 'settings/analytics' })).value !== 'false';
	const theme = ((await Preferences.get({ key: 'settings/theme' })).value || 'system') as 'light'|'dark'|'system';
	appSettings.set({ distanceLock, mockUnlock, backgroundLocation, analytics, theme });
	appSettings.subscribe(async v => {
		Preferences.set({ key: 'settings/distanceLock', value: v.distanceLock.toString() });
		Preferences.set({ key: 'settings/mockUnlock', value: v.mockUnlock.toString() });
		Preferences.set({ key: 'settings/backgroundLocation', value: v.backgroundLocation.toString() });
		Preferences.set({ key: 'settings/analytics', value: v.analytics.toString() });
		Preferences.set({ key: 'settings/theme', value: v.theme });
	});
}