import { get } from 'svelte/store';
import { getTokensLogin, getTokensRefresh, getUserInfo } from './emel-api/emel-api';
import { firebaseToken, token, tokenServerMessage, user, userCredentials } from './state';
import { FIREBASE_TOKEN_URL } from './constants';
import { version } from '$app/environment';
import { httpRequestWithRetry } from '$lib/utils';

export async function fetchFirebaseToken() {
	const response = await httpRequestWithRetry({
		method: 'get',
		url: FIREBASE_TOKEN_URL,
		headers: {
			'User-Agent': `Gira+/${version}`,
		},
	});
	if (!response || !response.data) return false;
	if (!response.data) return false;
	await firebaseToken.set(response.data);
	return true;
}

export async function login(email: string, password: string) {
	if (!await fetchFirebaseToken()) return 1;
	const response = await getTokensLogin(email, password);
	if (response.error.code !== 0) return response.error.code;
	const { accessToken, refreshToken, expiration } = response.data;
	if (!accessToken || !refreshToken) return response.error.code;
	token.set({ accessToken, refreshToken, expiration });
	return 0;
}

const msBetweenRefreshAttempts = 2000;
const attempts = 5;
export async function refreshToken() {
	if (!await fetchFirebaseToken()) return false;
	const tokens = get(token);
	if (!tokens) return false;
	let success = false;
	for (let i = 0; i < attempts && !success; i++) {
		const response = await getTokensRefresh(tokens);
		if (response.error.code !== 0 || !response.data.accessToken || !response.data.refreshToken) {
			await new Promise(resolve => setTimeout(resolve, msBetweenRefreshAttempts));
			continue;
		}
		const { accessToken, refreshToken, expiration } = response.data;
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