import * as base64url from './base64url.js'
import { encrypt, decrypt } from './crypto.js'
import { binaryStream } from './binaryStream.js'

const url = new URL('/', location.href)
url.port = '8017'

export class Todo {
  /**
   * @param {string} oid base64url-encoded 12-byte OID
   * @param {number} rev revision number starting from the initial random value
   * @param {string} text
   */
  constructor(oid, rev, text) {
    this.text = text
    this.oid = oid
    this.rev = rev
    this.dom = this.createDOM()
  }

  createDOM() {
    const li = document.createElement('li')
    li.textContent = this.text
    //@ts-ignore (silly VSCode thinks this is a string)
    li.contentEditable = true
    li.id = this.oid
    return li
  }

  static get(id) {
    return todos.get(id)
  }

  static async fetchAll() {
    return fetch(`${url.href}todos`)
    .then(async function *(res) {
      for await (const line of binaryStream(res.body)) {
        const id = base64url.encode(line.id)
        const view = new DataView(line.data.buffer, line.data.byteOffset, 4)
        const rev = view.getUint32(0)
        try {
          const text = await decrypt(line.data, id)
          const todo = new Todo(id, line.rev, text)
          todos.set(id, todo)
          yield todo
        } catch (err) {
          // decrypt() will throw for every todo that belongs to another user, no worry
        }
      }
    })
  }

  static async create(text) {
    const iv = new Uint8Array(16)
    await crypto.getRandomValues(iv)
    const oid = base64url.encode(iv.subarray(0, 12))
    const rev = new DataView(iv.buffer).getUint32(12)
    return encrypt(text, iv)
    .then(buffer => fetch(`${url.href}todo/${oid}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/octet-stream' },
      body: buffer
    }))
    .catch(err => {})
    .then(res => {
      const todo = new Todo(oid, rev, text)
      todos.set(oid, todo)
      return todo
    })
  }

  save(text) {
    if (!text || text === this.text) return Promise.resolve()
    const rev = (this.rev + 1) % 2**32
    const iv = new Uint8Array(16)
    iv.set(base64url.decode(this.oid))
    new DataView(iv.buffer).setUint32(12, rev)
    return encrypt(text, iv)
    .then(buffer => fetch(`${url.href}todo/${this.oid}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/octet-stream' },
      body: buffer
    }))
    .then(res => {
      this.rev = rev
      this.text = text
    })
    .catch(err => {
      this.dom.textContent = this.text
    })
  }

  delete() {
    fetch(`${url.href}todo/${this.oid}`, {
      method: 'DELETE'
    })
    .then(res => {
      this.dom.remove()
      delete this.dom
      todos.delete(this.oid)
    })
  }
}
/** @type {Map<string, Todo>} */
const todos = new Map()
