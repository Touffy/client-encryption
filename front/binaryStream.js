/**
 * Parse a binary response stream into an async iterable of split buffers
 * @param {ReadableStream} body
 */
export async function *binaryStream(body) {
  const reader = body.getReader()
  /** @type {{id: Uint8Array, data: Uint8Array, rest: Uint8Array}} */
  let next = null
  let rest = new Uint8Array()

  while (next = await readOne(reader, rest)) {
    rest = next.rest
    yield {id: next.id, data: next.data}
  }

  reader.releaseLock()
}

/**
 * Concatenates the begining of a todo with as many bytes as needed from the next chunks
 * to completely decode the current todo
 * @param {ReadableStreamReader} reader
 * @param {Uint8Array} current
 */
async function readOne(reader, current) {
  /** @type {IteratorResult<Uint8Array>} */
  let next
  let rest = new Uint8Array()
  while (current.length < 14) { // get enough bytes to read the id and length
    next = await reader.read()
    if (next.done) return null
    rest = next.value.subarray(14 - current.length)
    current = new Uint8Array([...current, ...next.value.subarray(0, 14 - current.length)])
  }
  const id = current.subarray(0, 12)
  const view = new DataView(current.buffer, current.byteOffset + 12, 2)
  const l = view.getUint16(0)
  current = current.subarray(14)
  while (current.length + rest.length < l) { // now get enough bytes for the content
    next = await reader.read()
    rest = next.value.subarray(l - current.length)
    if (!current.length) current = next.value.subarray(0, l - current.length) // avoid copy if possible
    else current = new Uint8Array([...current, ...next.value.subarray(0, l - current.length)])
  }
  if (!current.length) {
    current = rest
    rest = new Uint8Array()
  }
  // now we have the whole content and maybe a rest
  const data = current.subarray(0, l)
  if (!rest.length) rest = current.subarray(l)
  return {id, data, rest}
}