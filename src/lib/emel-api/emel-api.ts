import { firebaseToken, type Token } from '$lib/account';
import { GIRA_AUTH_URL } from '$lib/constants';
import type { ApiResponse, TokenOpt, UserInfo } from '$lib/emel-api/types';
import { get } from 'svelte/store';
import { CapacitorHttp } from '@capacitor/core';

export async function getTokensLogin(email: string, password: string) {
	const options = {
		url: GIRA_AUTH_URL + '/login',
		headers: {
			'User-Agent': 'Gira/3.2.8 (Android 34)',
			'Content-Type': 'application/json',
			'Priority': 'high',
			'x-firebase-token': `${get(firebaseToken)}`,
		},
		data: {
			Provider: 'EmailPassword',
			CredentialsEmailPassword: {
				email,
				password,
			},
		},
	};

	const response = await CapacitorHttp.post(options);
	return response.data as ApiResponse<TokenOpt>;
}

export async function getTokensRefresh(tokens: Token) {
	const options = {
		url: GIRA_AUTH_URL + '/token/refresh',
		headers: {
			'User-Agent': 'Gira/3.2.8 (Android 34)',
			'Content-Type': 'application/json',
			'x-firebase-token': `${get(firebaseToken)}`,
		},
		data: {
			token: tokens.refreshToken,
		},
	};

	const response = await CapacitorHttp.post(options);
	return response.data as ApiResponse<TokenOpt>;
}

export async function getUserInfo(tokens: Token) {
	const options = {
		url: GIRA_AUTH_URL + '/user',
		headers: {
			'User-Agent': 'Gira/3.2.8 (Android 34)',
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${tokens.accessToken}`,
		},
	};

	const response = await CapacitorHttp.get(options);
	return response.data as ApiResponse<UserInfo>;
}