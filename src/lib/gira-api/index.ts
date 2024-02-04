import type { Mutation, Query } from './api-types';
export type ThrownError = {
	errors: {message:string}[];
	status: number;
};
export type Q<T extends (keyof Query)[]> = {[K in T[number]]:Query[K]};
export type M<T extends (keyof Mutation)[]> = {[K in T[number]]:Mutation[K]};