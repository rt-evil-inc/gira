import { currentTrip, stations, token, type ActiveTrip, tripRating } from '$lib/stores';
import { get } from 'svelte/store';
import type { ActiveTripSubscription, WSEvent } from './ws-types';
import { tripPayWithPoints } from '.';
import { currentPos } from '$lib/location';
let ws: WebSocket;

function randomUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8;
		return v.toString(16);
	});
}

export function startWS() {
	console.log('starting ws');
	const tokens = get(token);
	const access = tokens?.accessToken;
	if (!access) return;

	if (ws) {
		ws.onclose = () => {};
		if (ws.readyState === WebSocket.OPEN) ws.close();
	}
	ws = new WebSocket('wss://apigira.emel.pt/graphql', 'graphql-ws');
	ws.onopen = () => {
		backoff = 0;
		console.log('ws opened');
		ws.send(JSON.stringify({ 'type': 'connection_init' }));
		ws.send(JSON.stringify({
			'type': 'start',
			'id': randomUUID(),
			'payload': {
				'operationName': 'activeTripSubscription',
				'query': 'subscription activeTripSubscription($_access_token: String) { activeTripSubscription(_access_token: $_access_token) { code bike startDate endDate cost finished canPayWithMoney canUsePoints clientPoints tripPoints canceled period periodTime error}}',
				'variables': {
					'_access_token': access,
				},
			},
		}));
		ws.send(JSON.stringify({
			'type': 'start',
			'id': randomUUID(),
			'payload': {
				'operationName': 'operationalStationsSubscription',
				'query': 'subscription operationalStationsSubscription {operationalStationsSubscription {assetCondition, assetStatus, assetType, code, description, latitude, longitude, name, bikes, docks, serialNumber, stype}}',
				'variables': {
					'_access_token': access,
				},
			},
		}));
	};

	ws.onmessage = (event:MessageEvent<string>) => {
		const eventData = JSON.parse(event.data) as WSEvent;
		if (eventData.type === 'data') {
			const payload = eventData.payload;
			if (payload && payload.data) {
				const data = payload.data;
				if (data.operationalStationsSubscription) {
					console.log('updated stations with websocket');
					stations.set(data.operationalStationsSubscription);
				} else if (data.activeTripSubscription) {
					const recvTrip = data.activeTripSubscription;
					ingestTripMessage(recvTrip);
				} else if (data.serverDate) {
					console.log('serverdate', data.serverDate.date);
					console.log('serverdate diff', new Date(data.serverDate.date).getTime() - Date.now(), 'ms');
				}
			}
		}
	};

	let backoff = 0;
	function restartWS() {
		setTimeout(() => {
			startWS();
			backoff += 1000;
		}, backoff);
	}
	ws.onclose = e => {
		console.log('ws closed', e);
		restartWS();
	};
	ws.onerror = e => {
		console.log('ws error', e);
		restartWS();
	};
	console.log('ws started');
}
function ingestTripMessage(recvTrip:ActiveTripSubscription) {
	console.debug('ingesting trip message from ws', recvTrip);
	if (recvTrip.code === 'no_trip' || recvTrip.bike === 'dummy') return;
	const ctrip = get(currentTrip);
	if (recvTrip.code === ctrip?.code) ingestCurrentTripUpdate(recvTrip);
	else ingestOtherTripUpdate(recvTrip);
}

function ingestCurrentTripUpdate(recvTrip:ActiveTripSubscription) {
	currentTrip.update(trip => {
		// if trip finished, rate, else, update trip stuff
		if (recvTrip.finished) {
			tripRating.update(rating => {
				rating.currentRating = {
					code: recvTrip.code,
					bikeId: recvTrip.bike,
					startDate: new Date(recvTrip.startDate),
					endDate: new Date(recvTrip.endDate ?? 0),
					tripPoints: recvTrip.tripPoints ?? 0,
				};
				return rating;
			});
			return null;
		} else {
			if (recvTrip.canPayWithMoney) tripPayWithPoints(recvTrip.code);
			if (trip === null) throw new Error('trip is null in impossible place');
			return {
				...trip,
				startDate: new Date(recvTrip.startDate),
				bikeId: recvTrip.bike,
				code: recvTrip.code,
			};
		}
	});
}
function ingestOtherTripUpdate(recvTrip:ActiveTripSubscription) {
	if (recvTrip.finished) return;
	const p = get(currentPos);
	currentTrip.set({
		startDate: new Date(recvTrip.startDate),
		bikeId: recvTrip.bike,
		code: recvTrip.code,
		finished: recvTrip.finished,
		startPos: null,
		destination: null,
		travelledDistanceKm: 0,
		distanceLeft: null,
		speed: 0,
		predictedEndDate: null,
		arrivalTime: null,
		pathTaken: p ? [{
			lat: p.coords.latitude,
			lng: p.coords.longitude,
			time: new Date,
		}] : [],
	});
}