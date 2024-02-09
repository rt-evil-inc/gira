<script lang="ts">
	import { login } from '$lib/auth';
	import { onDestroy } from 'svelte';
	import { userCredentials } from '../state';
	import { Keyboard } from '@capacitor/keyboard';

	let email = '';
	let password = '';
	let errorCode:number|null = null;
	const errorCodes:{[key:number]:string} = {
		100: 'Credenciais inválidas',
	};
	function clearError() {
		errorCode = null;
	}
	async function loginWrapper() {
		errorCode = null;
		errorCode = await login(email, password);
		if (errorCode === 0) userCredentials.set({ email, password });
	}

	let keyboardHeight = 0;
	Keyboard.addListener('keyboardWillShow', (info:{keyboardHeight:number}) => keyboardHeight = info.keyboardHeight);
	Keyboard.addListener('keyboardWillHide', () => keyboardHeight = 0);

	onDestroy(() => {
		Keyboard.removeAllListeners();
	});
</script>

<div class="flex flex-col max-w-sm px-4 w-full h-full justify-center transition-all duration-300" style:padding-bottom="{keyboardHeight}px">
	<div class="bg-background rounded-2xl max-w-sm w-full flex flex-col items-center p-6" style:box-shadow="0px 0px 20px 0px var(--color-shadow)">
		<div class="text-center text-lg text-info font-semibold mb-2 rounded-lg">Bem vindo ao Gira+</div>
		<form class="flex flex-col w-full gap-4" on:submit={loginWrapper}>
			<div class="w-full">
				<div class="text-sm text-info font-medium pb-1">Email</div>
				<input type="email" required on:input={clearError} bind:value={email} placeholder="exemplo@exemplo.pt" class="placeholder-label w-full px-2 h-12 rounded-lg border border-background-tertiary bg-background-secondary focus:ring-primary focus:border-primary">
			</div>
			<div class="w-full">
				<div class="text-sm text-info font-medium pb-1">Password</div>
				<input type="password" required on:input={clearError} bind:value={password} placeholder="••••••••" class="placeholder-label w-full px-2 h-12 rounded-lg border border-background-tertiary bg-background-secondary focus:ring-primary focus:border-primary">
				{#if errorCode !== null && errorCode !== 0}
					<div class="text-sm text-red-500 pt-1">{errorCodes[errorCode] || 'Erro desconhecido'}</div>
				{/if}
			</div>
			<button class="form-textarea border-0 w-full h-12 rounded-lg bg-primary text-background font-bold focus:ring-primary focus:border-primary">Login</button>
		</form>
	</div>
</div>