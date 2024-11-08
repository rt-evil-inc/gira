import { firebaseToken, type Token } from '$lib/account';
import { GIRA_AUTH_URL } from '$lib/constants';
import type { ApiResponse, TokenOpt, UserInfo } from '$lib/emel-api/types';
import { get } from 'svelte/store';

export async function getTokensLogin(email: string, password: string) {
	return await fetch(GIRA_AUTH_URL + '/login', {
		method: 'POST',
		headers: {
			'User-Agent': 'Gira/3.2.8 (Android 34)',
			'Content-Type': 'application/json',
			'Priority': 'high',
			'x-firebase-token': `${get(firebaseToken)}`,
		},
		body: JSON.stringify({
			Provider: 'EmailPassword',
			CredentialsEmailPassword: {
				email,
				password,
			},
		}),
	}).then(res => res.json() as Promise<ApiResponse<TokenOpt>>);
}

export async function getTokensRefresh(tokens: Token) {
	return await fetch(GIRA_AUTH_URL + '/token/refresh', {
		method: 'POST',
		headers: {
			'User-Agent': 'Gira/3.2.8 (Android 34)',
			'Content-Type': 'application/json',
			'x-firebase-token': `${get(firebaseToken)}`,
		},
		body: JSON.stringify({
			token: tokens.refreshToken,
		}),
	}).then(res => res.json() as Promise<ApiResponse<TokenOpt>>);
}

export async function getUserInfo(tokens: Token) {
	return await fetch(GIRA_AUTH_URL + '/user', {
		method: 'GET',
		headers: {
			'User-Agent': 'Gira/3.2.8 (Android 34)',
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${tokens.accessToken}`,
		},
	}).then(res => res.json() as Promise<ApiResponse<UserInfo>>);
}