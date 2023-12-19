import { currentTrip, stations, token, type ActiveTrip } from '$lib/stores';
import { get } from 'svelte/store';
import type { WSEvent } from './ws-types';
import { tripPayWithNoPoints } from '.';
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
					stations.set(data.operationalStationsSubscription);
				} else if (data.activeTripSubscription) {
					const activeTripSubscription = data.activeTripSubscription;
					// UNTESTED, REQUIRE REAL TRIP
					currentTrip.update(trip => {
						if (activeTripSubscription.code === 'no_trip' || activeTripSubscription.bike === 'dummy' || activeTripSubscription.finished === true) return null;
						if (trip) {
							trip.startDate = new Date(activeTripSubscription.startDate);
							trip.bikeId = activeTripSubscription.bike;
							trip.code = activeTripSubscription.code;
							trip.finished = activeTripSubscription.finished;
						} else {
							const pos = get(currentPos);
							trip = {
								startDate: new Date(activeTripSubscription.startDate),
								bikeId: activeTripSubscription.bike,
								code: activeTripSubscription.code,
								finished: activeTripSubscription.finished,
								startPos: pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude } : null,
								destination: null,
								distance: 0,
								distanceLeft: null,
								speed: pos && pos.coords && pos.coords.speed ? pos.coords.speed : 0,
								predictedEndDate: null,
								arrivalTime: null,
							};
						}
						return trip;
					});
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
//TODO reliability issues