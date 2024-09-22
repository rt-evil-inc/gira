<script lang="ts">
	import { loadUserCreds, safeInsets, token, appSettings } from '$lib/state';
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
	import { initAnalytics } from '$lib/analytics';
	import { ScreenOrientation } from '@capacitor/screen-orientation';

	if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
		StatusBar.setOverlaysWebView({ overlay: true });
		NavigationBar.setTransparency({ isTransparent: true });
		SafeArea.getSafeAreaInsets().then(ins => {
			safeInsets.set(ins.insets);
		});
	}

	onMount(() => {
		loadUserCreds();
		initAnalytics();
		App.addListener('resume', () => {
			if ($token != null && $token.refreshToken != null) {
				console.debug('Refreshing token because app was reopened');
				refreshToken();
			}
			updateActiveTripInfo();
		});

		ScreenOrientation.lock({ orientation: 'portrait' });

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const updateTheme = () => {
			document.documentElement.setAttribute('data-theme', $appSettings.theme === 'system' ? mediaQuery.matches ? 'dark' : 'light' : $appSettings.theme);
			StatusBar.setStyle({ style: $appSettings.theme === 'system' ? mediaQuery.matches ? Style.Dark : Style.Light : $appSettings.theme === 'dark' ? Style.Dark : Style.Light });
		};
		appSettings.subscribe(updateTheme);
		mediaQuery.addEventListener('change', updateTheme);
		updateTheme();

		return () => {
			App.removeAllListeners();
			mediaQuery.removeEventListener('change', updateTheme);
		};
	});
</script>

<div class="w-screen h-screen font-sans">
	<slot />
</div>