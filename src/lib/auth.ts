import { get } from 'svelte/store';
import { getTokensLogin, getTokensRefresh, getUserInfo } from './emel-api/emel-api';
import { addErrorMessage, encryptedFirebaseToken, token, user, userCredentials } from './state';
import { GIRA_MAIS_API_URL } from './constants';
import { version } from '$app/environment';
import { httpRequestWithRetry } from '$lib/utils';

export async function fetchEncryptedFirebaseToken(accessToken?: string) {
	if (!accessToken) return false;
	const response = await httpRequestWithRetry({
		method: 'get',
		url: GIRA_MAIS_API_URL + '/encrypted-token',
		headers: {
			'User-Agent': `Gira+/${version}`,
			'x-gira-token': accessToken,
		},
	});
	if (response?.data === 'no tokens available') {
		addErrorMessage('Sem tokens disponíveis');
		return false;
	} else if (response?.data === 'failed to encrypt token') {
		addErrorMessage('Erro ao encriptar o token');
		return false;
	} else if (!response || response.status !== 200 || !response.data) {
		addErrorMessage('Erro ao obter um token');
		return false;
	}
	await encryptedFirebaseToken.set(response.data);
	return true;
}

export async function login(email: string, password: string) {
	const response = await getTokensLogin(email, password);
	if (response.error.code !== 0) return response.error.code;
	const { accessToken, refreshToken, expiration } = response.data;
	if (!accessToken || !refreshToken) return response.error.code;
	await fetchEncryptedFirebaseToken(accessToken);
	token.set({ accessToken, refreshToken, expiration });
	return 0;
}

const msBetweenRefreshAttempts = 2000;
const attempts = 5;
export async function refreshToken() {
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