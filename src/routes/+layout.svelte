<script lang="ts">
	import { currentTrip, loadUserCreds, safeInsets, token } from '$lib/state';
	import '@fontsource/inter/latin-400.css';
	import '@fontsource/inter/latin-500.css';
	import '@fontsource/inter/latin-600.css';
	import '@fontsource/inter/latin-700.css';
	import '@fontsource/roboto-mono/latin-400.css';
	import { onMount } from 'svelte';
	import { StatusBar, Style } from '@capacitor/status-bar';
	import { Capacitor } from '@capacitor/core';
	import { NavigationBar } from '@mauricewegner/capacitor-navigation-bar';
	import { SafeArea } from 'capacitor-plugin-safe-area';
	import '../app.css';
	import { App } from '@capacitor/app';
	import { refreshToken } from '$lib/auth';
	import { updateActiveTripInfo } from '$lib/state/helper';
	import { reportAppUsageEvent } from '$lib/gira-mais-api/gira-mais-api';

	if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
		StatusBar.setOverlaysWebView({ overlay: true });
		StatusBar.setStyle({ style: Style.Light });
		NavigationBar.setTransparency({ isTransparent: true });
		SafeArea.getSafeAreaInsets().then(ins => {
			safeInsets.set(ins.insets);
		});
	}

	onMount(() => {
		reportAppUsageEvent();
		loadUserCreds();
		App.addListener('resume', () => {
			if ($token != null && $token.refreshToken != null) {
				console.debug('Refreshing token because app was reopened');
				refreshToken();
			}
			updateActiveTripInfo();
		});
		return () => {
			App.removeAllListeners();
		};
	});
</script>

<div class="w-screen h-screen font-sans">
	<slot />
</div>