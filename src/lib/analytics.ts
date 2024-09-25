import posthog from 'posthog-js';

const POSTHOG_URL = 'https://posthog.tteles.dev';
const POSTHOG_API_KEY = 'phc_TzcytD0DrmirOxFVVSYR8azP3jpsNiWXcSLZ5qd8kFj';

export function initAnalytics() {
	// posthog.debug();
	posthog.init(POSTHOG_API_KEY, {
		api_host: POSTHOG_URL,
		person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
	});
}

export function captureEvent(event: string, properties?: Record<string, any>) {
	console.debug('capturing event', event, properties);
	posthog.capture(event, properties);
}

export function optInAnalytics() {
	posthog.opt_in_capturing();
}

export function optOutAnalytics() {
	posthog.opt_out_capturing();
}