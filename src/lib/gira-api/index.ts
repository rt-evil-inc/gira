import { GiraApi } from './GiraApi';
import type { Mutation, Query } from './types';
export type ThrownError = {
	errors: {message:string}[];
	status: number;
};
export type Q<T extends (keyof Query)[]> = {[K in T[number]]:Query[K]};
export type M<T extends (keyof Mutation)[]> = {[K in T[number]]:Mutation[K]};
export interface GiraApiInterface{
	reserveBike(serialNumber:string): Promise<M<['reserveBike']>>
	getStationInfo(stationId:string): Promise<Q<['getBikes', 'getDocks']>>
	reserveBike(serialNumber:string): Promise<M<['reserveBike']>>
	cancelBikeReserve(): Promise<M<['cancelBikeReserve']>>
	startTrip(): Promise<M<['startTrip']>>
	rateTrip(tripCode:string, tripRating:number, tripComment?:string, tripAttachment?:File): Promise<M<['rateTrip']>>
	tripPayWithNoPoints(tripCode:string): Promise<M<['tripPayWithNoPoints']>>
	tripPayWithPoints(tripCode:string): Promise<M<['tripPayWithPoints']>>
	fullOnetimeInfo(): Promise<Q<['getStations', 'client', 'activeUserSubscriptions', 'activeTrip', 'unratedTrips', 'tripHistory']>>
	getTripHistory(pageNum:number, pageSize:number): Promise<Q<['tripHistory']>>
	getActiveTripInfo(): Promise<Q<['activeTrip']>>
}
export const api:GiraApiInterface = new GiraApi;