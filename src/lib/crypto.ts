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

export async function encryptToken(integrityToken: string, authToken: string): Promise<string | null> {
	try {
		const keyAndIV = await getKeyAndIV(authToken);
		if (!keyAndIV) return null;

		const [key, iv] = keyAndIV;
		const plaintext = (new TextEncoder).encode(integrityToken);

		// Apply PKCS7 padding
		const blockSize = 16;
		const padding = blockSize - (plaintext.length % blockSize);
		const padtext = new Uint8Array(plaintext.length + padding);
		padtext.set(plaintext);
		for (let i = plaintext.length; i < padtext.length; i++) {
			padtext[i] = padding;
		}

		// Generate AES-CBC key from raw bytes
		const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'AES-CBC' }, false, ['encrypt']);

		// Encrypt the data
		const ciphertext = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, cryptoKey, padtext);

		// Convert to base64
		return btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
	} catch (e) {
		console.error('Encryption error:', e);
		return null;
	}
}

export async function hash(data: string): Promise<string> {
	const dataBuffer = (new TextEncoder).encode(data);
	const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}