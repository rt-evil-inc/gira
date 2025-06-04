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
	const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, ['encrypt']);

	// Encrypt - let Web Crypto API handle padding automatically
	const encrypted = await crypto.subtle.encrypt({	name: 'AES-CBC',	iv: ivBytes }, cryptoKey, dataBytes);

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