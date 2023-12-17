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
				'primary': '#79c000',
			},
			borderRadius: {
				'4xl': '2rem',
			},
			fontSize: {
				'xxs': '0.625rem',
			},
		},
	},
	plugins: [require('@tailwindcss/forms')],
};