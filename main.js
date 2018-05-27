const app = require('express')()
const cors = require('cors')
const LRU = require('lru-cache')
const bodyParser = require('body-parser')


function idLen(str, l) {
  const buffer = new Buffer(14)
  buffer.write(str.replace(/-/g, '+').replace(/_/g, '/'), 0, 12, 'base64')
  buffer.writeUInt16BE(l, 12)
  return buffer
}

/** @type {LRU.Cache<string, Buffer>} */
const todos = LRU({max: 2000})

app.get('/todos', cors({ methods: ['GET'] }), (req, res) => {
  res.status(200).type('application/octet-stream')
  todos.rforEach((text, id) => {
    res.write(idLen(id, text.length))
    res.write(text)
  })
  res.end()
})

app.options('/todo/:id', cors({ methods: ['PUT', 'DELETE'] }))
app.put('/todo/:id', cors({ methods: ['PUT', 'DELETE'] }), bodyParser.raw({limit: 5000}), (req, res) => {
  if (!/^[a-z0-9_-]{16}$/i.test(req.params.id)) return res.status(400).end()
  const status = 201 - +todos.has(req.params.id)
  todos.set(req.params.id, req.body)
  res.status(status).end()
})
app.delete('/todo/:id', cors({ methods: ['PUT', 'DELETE'] }), (req, res) => {
  if (todos.has(req.params.id)) {
    todos.del(req.params.id)
    res.status(204).end()
  } else {
    res.status(404).end()
  }
})

app.listen(8017)
