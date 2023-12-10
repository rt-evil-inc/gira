<script lang="ts">
	import { login } from '$lib/auth';
	import { getBikes, getDocks, getStations } from '$lib/gira-api';
	let email = '';
	let password = '';
	async function loginWrapper() {
		let res = await login(email, password);
		console.log(res);
	}
</script>
<div class="max-w-sm px-4 w-full">
	<div class="bg-white rounded-lg shadow-lg max-w-sm w-full flex flex-col items-center p-6">
		<div class="text-center text-lg text-slate-800 font-medium mb-2 rounded-md">Bem vindo ao mGira!</div>
		<form class="flex flex-col w-full gap-4" on:submit={() => loginWrapper() }>
			<div class="w-full">
				<div class="text-sm text-slate-700 pb-1">Email</div>
				<input type="email" required bind:value={email} placeholder="example@example.pt" class="w-full px-2 h-12 rounded-md border border-slate-200 bg-slate-100 focus:ring-green-500 focus:border-green-500">
			</div>
			<div class="w-full">
				<div class="text-sm text-slate-700 pb-1">Password</div>
				<input type="password" required bind:value={password} class="w-full px-2 h-12 rounded-md border border-slate-200 bg-slate-100 focus:ring-green-500 focus:border-green-500">
			</div>
			<button class="form-textarea border-0  w-full h-12 rounded-md bg-green-400 text-white font-semibold font-mono focus:ring-green-500 focus:border-green-500 ">Login</button>
		</form>
	</div>
</div>