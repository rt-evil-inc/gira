import { get, writable } from 'svelte/store';
import { getTokensLogin, getTokensRefresh, getUserInfo } from '$lib/emel-api/emel-api';
import { currentTrip, tripRating } from '$lib/trip';
import { selectedStation } from '$lib/map';
import { Preferences } from '@capacitor/preferences';
import { startWS } from '$lib/gira-api/ws';
import { updateOnetimeInfo } from '$lib/injest-api-data';
import { TOKEN_EXCHANGE_URL } from './constants';
import { version } from '$app/environment';
import { httpRequestWithRetry } from '$lib/utils';

export type Token = {
  accessToken: string;
	refreshToken: string;
	expiration: number;
};
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
export type User = {
	email: string;
	name: string;
}
export type Subscription = {
	active: boolean;
	expirationDate: Date;
	name: string;
	subscriptionStatus: string;
	type:string
}
export type AccountInfo = {
	bonus: number;
	balance: number;
	subscription: Subscription|null;
}

export const token = writable<Token|null|undefined>(undefined);
export const encryptedFirebaseToken = writable<string|null>(null);
export const userCredentials = writable<{email: string, password: string}|null>(null);
export const user = writable<User|null>(null);
export const accountInfo = writable<AccountInfo|null>(null);

let tokenRefreshTimeout: ReturnType<typeof setTimeout>|null = null;
token.subscribe(async v => {
	if (!v) return;
	const jwt:JWT = JSON.parse(window.atob(v.accessToken.split('.')[1]));

	startWS();
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

	userCredentials.subscribe(async v => {
		if (!v) return;
		const responseCode = await login(v.email, v.password);
		if (responseCode !== 0) {
			console.error('Login failed!');
			token.set(null);
			// Invalid credentials
			if (responseCode === 100) {
				Preferences.remove({ key: 'email' });
				Preferences.remove({ key: 'password' });
			}
			userCredentials.set(null);
		} else {
			Preferences.set({ key: 'email', value: v.email });
			Preferences.set({ key: 'password', value: v.password });
		}
	});
}

export async function fetchEncryptedFirebaseToken(accessToken: string) {
	const options = {
		url: TOKEN_EXCHANGE_URL + '/exchangeEnc',
		method: 'get',
		headers: {
			'User-Agent': `Gira+/${version}`,
			'x-gira-token': accessToken,
		},
	};
	const response = await httpRequestWithRetry(options);
	if (!response || response.status !== 200 || !response.data) return false;
	await encryptedFirebaseToken.set(response.data);
	return true;
}

export async function login(email: string, password: string) {
	const response = await getTokensLogin(email, password);
	if (response.error.code !== 0) return response.error.code;
	const { accessToken, refreshToken, expiration } = response.data;
	if (!accessToken || !refreshToken) return response.error.code;
	if (!await fetchEncryptedFirebaseToken(accessToken)) return 1;
	token.set({ accessToken, refreshToken, expiration });
	return 0;
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

const msBetweenRefreshAttempts = 2000;
const attempts = 5;
export async function refreshToken() {
	const tokens = get(token);
	if (!tokens) return false;
	let success = false;
	for (let i = 0; i < attempts && !success; i++) {
		const response = await getTokensRefresh(tokens);
		if (!response.error || response.error.code !== 0 || !response.data.accessToken || !response.data.refreshToken) {
			await new Promise(resolve => setTimeout(resolve, msBetweenRefreshAttempts));
			continue;
		}
		const { accessToken, refreshToken, expiration } = response.data;
		if (!await fetchEncryptedFirebaseToken(accessToken)) return false;
		token.set({ accessToken, refreshToken, expiration });
		success = true;
	}
	if (!success) {
		const success = false;
		for (let i = 0; i < attempts && !success; i++) {
			const creds = get(userCredentials);
			if (!creds) return false;
			const res = await login(creds.email, creds.password);
			if (res !== 0) {
				// Invalid credentials
				await new Promise(resolve => setTimeout(resolve, msBetweenRefreshAttempts));
				continue;
			} else {
				break;
			}
		}
		return success;
	}
	return true;
}

export async function updateUserInfo() {
	const tokens = get(token);
	if (!tokens) return;
	const response = await getUserInfo(tokens);
	const { email, name } = response.data;
	user.set({ email, name });
}