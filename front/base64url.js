/** Decodes a base64url-encoded string (which differs from base64 at digits 62 and 63)
 * @param {string} str */
export function decode(str) {
	const decoded = atob(str.replace(/-/g, '+').replace(/_/g, '/'))
	return new Uint8Array([...decoded].map(c => c.charCodeAt(0)))
}


/** Encodes a string or ArrayBuffer as base64url (which differs from base64 at digits 62 and 63 and has no padding)
 * @param {string|Uint8Array|ArrayBuffer} str */
export function encode(str) {
	if (typeof str !== 'string') {
		if (str instanceof ArrayBuffer) str = new Uint8Array(str)
		if (str instanceof Uint8Array) str = String.fromCharCode(...str)
	}
	return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=*$/, '')
}
