import { get } from 'svelte/store';
import { getTokensLogin, getTokensRefresh, getUserInfo } from './emel-api/emel-api';
import { addLoadingTask, removeLoadingTask, token, user } from './stores';

export async function login(email: string, password: string) {
	const id = addLoadingTask();
	const response = await getTokensLogin(email, password);
	removeLoadingTask(id);
	if (response.error.code !== 0) return response.error.code;
	const { accessToken, refreshToken, expiration } = response.data;
	if (!accessToken || !refreshToken) return response.error.code;
	token.set({ accessToken, refreshToken, expiration });
	return 0;
}

const msBetweenRefreshAttempts = 2000;
export async function refreshToken() {
	const tokens = get(token);
	if (!tokens) return;
	const id = addLoadingTask();
	let success = false;
	while (!success) {
		const response = await getTokensRefresh(tokens);
		if (response.error.code !== 0 || !response.data.accessToken || !response.data.refreshToken) {
			await new Promise(resolve => setTimeout(resolve, msBetweenRefreshAttempts));
			continue;
		}
		const { accessToken, refreshToken, expiration } = response.data;
		token.set({ accessToken, refreshToken, expiration });
		success = true;
	}
	removeLoadingTask(id);
	return true;
}

export async function updateUserInfo() {
	const tokens = get(token);
	if (!tokens) return;
	const id = addLoadingTask();
	const response = await getUserInfo(tokens);
	const { email, name } = response.data;
	user.set({ email, name });
	removeLoadingTask(id);
}