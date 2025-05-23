async function getKeyAndIV(authToken: string): Promise<[Uint8Array, Uint8Array] | null> {
	try {
		// Parse JWT without verification
		const tokenParts = authToken.split('.');
		if (tokenParts.length !== 3) {
			return null;
		}

		// Decode the payload
		const payloadBase64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
		const payload = JSON.parse(atob(payloadBase64));

		// Extract sub claim for key
		const sub = payload.sub;
		if (!sub || typeof sub !== 'string' || sub.length < 36) {
			return null;
		}

		// Remove hyphens from sub and use as key
		const key = sub.replace(/-/g, '');
		if (key.length !== 32) {
			return null;
		}

		// Extract jti claim for IV
		const jti = payload.jti;
		if (!jti || typeof jti !== 'string' || jti.length < 16) {
			return null;
		}

		// Convert to Uint8Array (needed for Web Crypto API)
		const keyBytes = (new TextEncoder).encode(key);
		const ivBytes = (new TextEncoder).encode(jti.substring(0, 16));

		return [keyBytes, ivBytes];
	} catch (e) {
		console.error('Error parsing JWT token:', e);
		return null;
	}
}

export async function encryptToken(integrity_token: string, auth_token: string): Promise<string> {
	// Parse JWT without verification
	const tokenParts = auth_token.split('.');
	if (tokenParts.length !== 3 || !tokenParts[1]) {
		throw new Error('Invalid JWT format');
	}

	// Decode the payload
	const payloadBase64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
	const decoded = JSON.parse(atob(payloadBase64)) as { sub: string; jti: string };
	const keyString = decoded.sub.replace(/-/g, '');
	const ivString = decoded.jti.slice(0, 16);

	// Convert strings to Uint8Array
	const encoder = new TextEncoder;
	const keyBytes = encoder.encode(keyString);
	const ivBytes = encoder.encode(ivString);
	const dataBytes = encoder.encode(integrity_token);

	// Import the key
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		keyBytes,
		{ name: 'AES-CBC' },
		false,
		['encrypt'],
	);

	// Encrypt - let Web Crypto API handle padding automatically
	const encrypted = await crypto.subtle.encrypt(
		{
			name: 'AES-CBC',
			iv: ivBytes,
		},
		cryptoKey,
		dataBytes,
	);

	// Convert to base64
	const encryptedArray = new Uint8Array(encrypted);
	const encrypted_firebase_token = btoa(String.fromCharCode(...encryptedArray));

	return encrypted_firebase_token;
}

export async function hash(data: string): Promise<string> {
	const dataBuffer = (new TextEncoder).encode(data);
	const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}