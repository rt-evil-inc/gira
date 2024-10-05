import type { Token } from '$lib/account';
import type { ApiResponse, TokenOpt, UserInfo } from '$lib/emel-api/types';

export async function getTokensLogin(email: string, password: string) {
	return await fetch('https://api-auth.emel.pt/auth', {
		method: 'POST',
		headers: {
			'User-Agent': 'Gira/3.2.8 (Android 34)',
			'Content-Type': 'application/json',
			'Priority': 'high',
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
	return await fetch('https://api-auth.emel.pt/token/refresh', {
		method: 'POST',
		headers: {
			'User-Agent': 'Gira/3.2.8 (Android 34)',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			token: tokens.refreshToken,
		}),
	}).then(res => res.json() as Promise<ApiResponse<TokenOpt>>);
}

export async function getUserInfo(tokens: Token) {
	return await fetch('https://api-auth.emel.pt/user', {
		method: 'GET',
		headers: {
			'User-Agent': 'Gira/3.2.8 (Android 34)',
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${tokens.accessToken}`,
		},
	}).then(res => res.json() as Promise<ApiResponse<UserInfo>>);
}