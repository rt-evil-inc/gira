let ws:WebSocket;
import { token } from './stores';
function startWS() {
	ws = new WebSocket('wss://apigira.emel.pt/graphql', 'graphql-ws');
	ws.onopen = function () {
		ws.send(JSON.stringify({ 'type': 'connection_init' }));
		ws.send(JSON.stringify({
			'type': 'start',
			'id': crypto.randomUUID(),
			'payload': {
				'operationName': 'activeTripSubscription',
				'query': 'subscription activeTripSubscription($_access_token: String) { activeTripSubscription(_access_token: $_access_token) { code bike startDate endDate cost finished canPayWithMoney canUsePoints clientPoints tripPoints canceled period periodTime error}}',
				'variables': {
					'_access_token': $user.token,
				},
			},
		}));
		ws.send(JSON.stringify({
			'type': 'start',
			'id': crypto.randomUUID(),
			'payload': {
				'operationName': 'operationalStationsSubscription',
				'query': 'subscription operationalStationsSubscription {operationalStationsSubscription {assetCondition, assetStatus, assetType, code, description, latitude, longitude, name, bikes, docks, serialNumber, stype}}',
				'variables': {
					'_access_token': $user.token,
				},
			},
		}));
	};
}