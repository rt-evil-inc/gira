import { get } from 'svelte/store';
import { getTokensLogin, getTokensRefresh, getUserInfo } from './emel-api/emel-api';
import { addLoadingTask, removeLoadingTask, token, user } from './stores';

export async function login(email: string, password: string) {
	const id = addLoadingTask();
	const response = await getTokensLogin(email, password);
	removeLoadingTask(id);
	console.log(response.error);
	if (response.error.code !== 0) return response.error.code;
	const { accessToken, refreshToken, expiration } = response.data;
	if (!accessToken || !refreshToken) return response.error.code;
	token.set({ accessToken, refreshToken, expiration });
	return 0;
}

export async function refreshToken() {
	const tokens = get(token);
	if (!tokens) return;
	const id = addLoadingTask();
	const response = await getTokensRefresh(tokens);
	if (response.error.code !== 0) return false;
	const { accessToken, refreshToken, expiration } = response.data;
	if (!accessToken || !refreshToken) return false;
	token.set({ accessToken, refreshToken, expiration });
	removeLoadingTask(id);
	return true;
}

export async function updateUserInfo() {
	const tokens = get(token);
	console.log(tokens);
	if (!tokens) return;
	const id = addLoadingTask();
	const response = await getUserInfo(tokens);
	const { email, name } = response.data;
	user.set({ email, name });
	removeLoadingTask(id);
}