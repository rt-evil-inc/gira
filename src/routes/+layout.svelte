<script lang="ts">
	import { safeInsets } from '$lib/ui';
	import { appSettings } from '$lib/settings';
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
	import { loadUserCreds, refreshToken, token } from '$lib/account';
	import { updateActiveTripInfo } from '$lib/injest-api-data';
	import { ScreenOrientation } from '@capacitor/screen-orientation';
	import { getTheme } from '$lib/utils';
	import { loadSettings } from '$lib/settings';
	import { reportAppUsageEvent } from '$lib/gira-mais-api/gira-mais-api';
	import { watchPosition } from '$lib/location';

	if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
		StatusBar.setOverlaysWebView({ overlay: true });
		NavigationBar.setTransparency({ isTransparent: true });
		SafeArea.getSafeAreaInsets().then(ins => {
			safeInsets.set(ins.insets);
		});
	}

	onMount(() => {
		loadUserCreds();
		loadSettings().then(() => {
			reportAppUsageEvent();
			appSettings.subscribe(() => {
				watchPosition();
				updateTheme();
			});
		});
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
			if (!$appSettings?.theme) return;
			const currentTheme = getTheme();
			document.documentElement.setAttribute('data-theme', currentTheme);
			if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') StatusBar.setStyle({ style: currentTheme == 'dark' ? Style.Dark : Style.Light });
		};
		mediaQuery.addEventListener('change', updateTheme);

		return () => {
			App.removeAllListeners();
			mediaQuery.removeEventListener('change', updateTheme);
		};
	});
</script>

{#if $appSettings?.theme}
	<div class="w-screen h-screen font-sans">
		<slot />
	</div>
{/if}