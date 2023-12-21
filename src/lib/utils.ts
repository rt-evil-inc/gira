export const deg2rad = (deg:number) => deg * (Math.PI / 180);

export function distanceBetweenCoords(lat1:number, lon1:number, lat2:number, lon2:number) {
	const R = 6371;
	const dLat = deg2rad(lat2 - lat1);
	const dLon = deg2rad(lon2 - lon1);
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const d = R * c;
	return d;
}

export function formatDistance(distance:number) {
	if (distance < 1) return `${(distance * 1000).toFixed(0)}m`;
	return `${distance.toLocaleString(undefined, { maximumFractionDigits: 2, useGrouping: false })}km`;
}