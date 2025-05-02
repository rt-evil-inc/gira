import { get, writable } from 'svelte/store';
import type { ThrownError } from '$lib/gira-api/api-types';
import { accountInfo } from '$lib/account';
import { errorMessages } from '$lib/ui';
import { appSettings } from '$lib/settings';
import { currentPos, watchPosition } from '$lib/location';
import { distanceBetweenCoords } from '$lib/utils';
import { LOCK_DISTANCE_m } from '$lib/constants';
import { reserveBike, startTrip } from '$lib/gira-api/api';
import type { StationInfo } from './map';
import { updateActiveTripInfo } from './injest-api-data';
import { reportTripStartEvent } from './gira-mais-api/gira-mais-api';

export type ActiveTrip = {
	code: string,
	bikePlate: string|null,
	startPos: {lat: number, lng: number}|null,
	destination: {lat: number, lng: number}|null,
	traveledDistanceKm: number,
	distanceLeft: number|null,
	speed: number,
	startDate: Date,
	predictedEndDate: Date|null,
	arrivalTime: Date|null,
	finished: boolean,
	confirmed: boolean,
	pathTaken : {lat: number, lng: number, time:Date}[]
}
export type TripRating = {
	currentRating:{
		code:string,
		bikePlate:string|null,
		startDate:Date,
		endDate:Date,
		tripPoints:number,
	}|null,
}

export const currentTrip = writable<ActiveTrip|null>(null);
export const tripRating = writable<TripRating>({ currentRating: null });

async function checkTripStarted(serial: string) {
	if (get(currentTrip) === null) return;
	if ((await reserveBike(serial)).reserveBike) {
		currentTrip.set(null);
	} else if (!get(currentTrip)?.confirmed) {
		updateActiveTripInfo();
	}
}

export async function tryStartTrip(id: string, serial: string, station: StationInfo) {
	if (serial == null) return;
	try {
		if (get(accountInfo)?.subscription === null) {
			errorMessages.add('Não tem uma subscrição ativa');
			return false;
		}
		if ((get(accountInfo)?.balance ?? 0) < 0) {
			errorMessages.add('Não é possível desbloquear bicicletas se o seu saldo for negativo');
			return false;
		}
		if (get(appSettings).distanceLock) {
			const pos = get(currentPos);
			if (pos == null) {
				errorMessages.add('Não foi possível determinar a sua posição');
				return false;
			} else {
				if (distanceBetweenCoords(pos.coords.latitude, pos.coords.longitude, station.latitude, station.longitude) > LOCK_DISTANCE_m / 1000) {
					errorMessages.add('Não está perto o suficiente da estação');
					return false;
				}
			}
		}
		const reservedBike = (await reserveBike(serial)).reserveBike;
		if (reservedBike) {
			const success = (await startTrip()).startTrip;
			if (success) {
				reportTripStartEvent(serial, station.serialNumber);
				for (let i = 15000; i <= 30000; i += 5000) {
					setTimeout(() => checkTripStarted(serial), i);
				}
				const pos = get(currentPos);
				currentTrip.set({
					code: '',
					arrivalTime: null,
					bikePlate: id,
					traveledDistanceKm: 0,
					destination: null,
					distanceLeft: null,
					speed: 0,
					startDate: new Date,
					startPos: pos ? {
						lng: pos.coords.longitude,
						lat: pos.coords.latitude,
					} : null,
					predictedEndDate: null,
					finished: false,
					confirmed: false,
					pathTaken: pos ? [{
						lng: pos.coords.longitude,
						lat: pos.coords.latitude,
						time: new Date,
					}] : [],
				});
				watchPosition();
				return true;
			} else {
				errorMessages.add('Não foi possível desbloquear a bicicleta');
				return false;
			}
		}
	} catch (_e) {
		const knownErrors = ['Serviço indisponível. Horário de utilização entre as 06:00 e as 02:00.'];
		const e = _e as ThrownError;
		let addedError = false;
		if (e && e.errors) {
			for (const error of e.errors) {
				if (knownErrors.includes(error.message)) {
					errorMessages.add(error.message);
					addedError = true;
				}
			}
			if (!addedError) {
				errorMessages.add('Não foi possível desbloquear a bicicleta');
			}
		}
		console.error(e);
		return false;
	}
}