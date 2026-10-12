import { sveltekit } from '@sveltejs/kit/vite';
import { realpathSync } from 'node:fs';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
	plugins: [sveltekit()],
	server: {
		port: 5173,
		fs: {
			// Vite checks served files against their real path. When node_modules is a
			// symlink (e.g. a git worktree sharing the main checkout's install), assets
			// like the @fontsource woff files resolve outside the project and get a 403.
			allow: [realpathSync('node_modules')],
		},
		proxy: {
			'/__dev-proxy/emel': {
				target: 'https://login.emel.pt',
				changeOrigin: true,
				rewrite: path => path.replace(/^\/__dev-proxy\/emel/, ''),
			},
			'/__dev-proxy/vaimoo': {
				target: 'https://emel-consumerapp.vaimoo.com',
				changeOrigin: true,
				rewrite: path => path.replace(/^\/__dev-proxy\/vaimoo/, ''),
			},
			'/__dev-proxy/gira-mais': giraMaisProxy(loadEnv(mode, process.cwd(), 'VITE_').VITE_GIRA_MAIS_DEV_SERVER),
		},
	},
	test: {
		environment: 'happy-dom',
	},
}));

/**
 * The Gira+ API: production, or a local gira-web given as VITE_GIRA_MAIS_DEV_SERVER (e.g. http://localhost:5299).
 * Browsers won't let a page set User-Agent, which the server checks on reports, so the proxy sets it for a local one.
 */
function giraMaisProxy(localServer: string | undefined) {
	return {
		target: localServer || 'https://gira-mais.app',
		changeOrigin: true,
		rewrite: (path: string) => path.replace(/^\/__dev-proxy\/gira-mais/, ''),
		...localServer && { headers: { 'User-Agent': 'Gira+/dev' } },
	};
}