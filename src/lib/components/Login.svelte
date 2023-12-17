<script lang="ts">
	import { login } from '$lib/auth';
	import { userCredentials } from '../stores';
	let email = '';
	let password = '';
	let errorCode:number|null = null;
	let errorCodes:{[key:number]:string} = {
		100: 'Credenciais inválidas',
	};
	async function loginWrapper() {
		errorCode = await login(email, password);
		if (errorCode === 0) userCredentials.set({ email, password });
	}
</script>
<div class="max-w-sm px-4 w-full">
	<div class="bg-background rounded-lg shadow-lg max-w-sm w-full flex flex-col items-center p-6">
		<div class="text-center text-lg text-info font-medium mb-2 rounded-md">Bem vindo ao Gira+</div>
		<form class="flex flex-col w-full gap-4" on:submit={loginWrapper}>
			<div class="w-full">
				<div class="text-sm text-info pb-1">Email</div>
				<input type="email" required bind:value={email} placeholder="example@example.pt" class="w-full px-2 h-12 rounded-md border border-background-tertiary bg-background-secondary focus:ring-primary focus:border-primary">
			</div>
			<div class="w-full">
				<div class="text-sm text-info pb-1">Password</div>
				<input type="password" required bind:value={password} placeholder="••••••••" class="placeholder-label w-full px-2 h-12 rounded-md border border-background-tertiary bg-background-secondary focus:ring-primary focus:border-primary">
				{#if errorCode !== null && errorCode !== 0}
					<div class="text-sm text-red-500 pt-1">{errorCodes[errorCode] || 'Erro desconhecido'}</div>
				{/if}
			</div>
			<button class="form-textarea border-0 w-full h-12 rounded-md bg-primary text-background font-bold focus:ring-primary focus:border-primary">Login</button>
		</form>
	</div>
</div>