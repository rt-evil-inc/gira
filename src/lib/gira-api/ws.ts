import { stations, token } from '$lib/stores';
import { get } from 'svelte/store';
import type { WSEvent } from './ws-types';
let ws: WebSocket;

function randomUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
		const r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8;
		return v.toString(16);
	});
}

export function startWS() {
	const tokens = get(token);
	const access = tokens?.accessToken;
	if (!access) return;
	if (ws) {
		ws.onclose = () => {};
		ws.close();
	}
	ws = new WebSocket('wss://apigira.emel.pt/graphql', 'graphql-ws');
	ws.onopen = () => {
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
		if (event.type === 'data') {
			const payload = eventData.payload;
			if (payload && payload.data) {
				const data = payload.data;
				if (data.operationalStationsSubscription) {
					stations.set(data.operationalStationsSubscription);
				}
			}
		}
	};

	ws.onclose = () => {
		console.log('ws closed');
		startWS();
	};
	ws.onerror = e => {
		console.log('ws error', e);
		startWS();
	};
	console.log('ws started');
}
//TODO reliability issues