import { type Token } from '$lib/account';
import { GIRA_AUTH_URL } from '$lib/constants';
import type { ApiResponse, TokenOpt, UserInfo } from '$lib/emel-api/types';
import { httpRequestWithRetry } from '$lib/utils';

export async function getTokensLogin(email: string, password: string) {
	const options = {
		url: GIRA_AUTH_URL + '/login',
		method: 'post',
		headers: {
			'User-Agent': 'Gira/3.4.3 (Android 34)',
			'Content-Type': 'application/json',
			'Priority': 'high',
		},
		data: {
			Provider: 'EmailPassword',
			CredentialsEmailPassword: {
				email,
				password,
			},
		},
	};

	const response = await httpRequestWithRetry(options, true);
	return response?.data as ApiResponse<TokenOpt>;
}

export async function getTokensRefresh(tokens: Token) {
	const options = {
		url: GIRA_AUTH_URL + '/token/refresh',
		method: 'post',
		headers: {
			'User-Agent': 'Gira/3.4.3 (Android 34)',
			'Content-Type': 'application/json',
		},
		data: {
			token: tokens.refreshToken,
		},
	};

	const response = await httpRequestWithRetry(options, true);
	return response?.data as ApiResponse<TokenOpt>;
}

export async function getUserInfo(tokens: Token) {
	const options = {
		url: GIRA_AUTH_URL + '/user',
		method: 'get',
		headers: {
			'User-Agent': 'Gira/3.4.3 (Android 34)',
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${tokens.accessToken}`,
		},
	};

	const response = await httpRequestWithRetry(options, true);
	return response?.data as ApiResponse<UserInfo>;
}