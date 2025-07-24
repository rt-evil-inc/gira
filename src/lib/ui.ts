import { writable } from 'svelte/store';

export type Insets = {
	top: number;
	bottom: number;
	left: number;
	right: number;
}

export const safeInsets = writable<Insets>({ top: 0, bottom: 0, left: 0, right: 0 });

export const errorMessages = (() => {
	const { subscribe, update } = writable<{ msg: string, id: number }[]>([]);
	const add = (msg: string, delay = 3000) => {
		const id = Math.random();
		update(messages => [...messages, { msg, id }].slice(-3));
		setTimeout(() => update(messages => messages.filter(m => m.id !== id)), delay);
	};
	return { subscribe, add };
})();

// TODO: remove this file and put it in a svelte file using context