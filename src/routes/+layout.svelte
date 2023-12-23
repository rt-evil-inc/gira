<script lang="ts">
	import { loadUserCreds, safeInsets } from '$lib/stores';
	import '@fontsource/inter/latin-400.css';
	import '@fontsource/inter/latin-500.css';
	import '@fontsource/inter/latin-600.css';
	import '@fontsource/inter/latin-700.css';
	import '@fontsource/roboto-mono/latin-400.css';
	import { onMount } from 'svelte';
	import { StatusBar, Style } from '@capacitor/status-bar';
	import { Capacitor } from '@capacitor/core';
	import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar';
	import { SafeArea } from 'capacitor-plugin-safe-area';
	import '../app.css';

	if (Capacitor.getPlatform() === 'android') {
		StatusBar.setOverlaysWebView({ overlay: true });
		StatusBar.setStyle({ style: Style.Light });
		NavigationBar.setTransparency({ isTransparent: true });
		SafeArea.getSafeAreaInsets().then(ins => {
			safeInsets.set(ins.insets);
		});
	}

	onMount(async () => {
		loadUserCreds();
	});
</script>

<div class="w-screen h-screen font-sans">
	<slot />
</div>