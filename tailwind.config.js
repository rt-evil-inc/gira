import theme from 'tailwindcss/defaultTheme';
/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				'sans': ['Inter', ...theme.fontFamily.sans],
				'mono': ['"Roboto Mono"', ...theme.fontFamily.mono],
			},
			colors: {
				'primary': 'hsl(var(--color-primary))',
				'background': 'hsl(var(--color-background))',
				'background-secondary': 'hsl(var(--color-background-secondary))',
				'background-tertiary': 'hsl(var(--color-background-tertiary))',
				'label': 'hsl(var(--color-label))',
				'info': 'hsl(var(--color-info))',
				'warning': 'hsl(var(--color-warning))',
			},
			borderRadius: {
				'4xl': '2rem',
			},
			fontSize: {
				'2xs': '0.58rem',
			},
		},
	},
	plugins: [require('@tailwindcss/forms')],
};