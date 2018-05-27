import { encode, decode } from './base64url.js'

async function newKey() {
  const key = await crypto.subtle.generateKey({name: 'AES-GCM', length: 128}, true, ['encrypt', 'decrypt'])
  localStorage.setItem('key', JSON.stringify(await crypto.subtle.exportKey('jwk', key)))
  console.log('new key created')
  return key
}

async function getKey() {
  const jwk = localStorage.getItem('key')
  if (jwk) return crypto.subtle.importKey('jwk', JSON.parse(jwk), 'AES-GCM', false, ['encrypt', 'decrypt'])
  return newKey()
}

const key = getKey()
const encoder = new TextEncoder()
const decoder = new TextDecoder()

export async function encrypt(/** @type {string} */text, /** @type {Uint8Array} */iv) {
  const cypher = await crypto.subtle.encrypt({name: 'AES-GCM', tagLength: 32, iv}, await key, encoder.encode(text))
  return new Uint8Array([...iv.subarray(12), ...new Uint8Array(cypher)])
}

export async function decrypt(/** @type {Uint8Array} */buffer, /** @type {string} */oid) {
  const iv = new Uint8Array([...decode(oid), ...buffer.subarray(0, 4)])
  const clear = await crypto.subtle.decrypt({name: 'AES-GCM', tagLength: 32, iv}, await key, buffer.subarray(4))
  return decoder.decode(clear)
}
