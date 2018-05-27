# Client-side Encryption Demo App

This is a toy todolist app that encrypts content in the browser with an AES key so the server (and anyone else) is unable to read it. The server is entirely unsecured and doesn't even have a concept of users, let alone authentication.

## how do I run it?

```sh
npm install
npm start
```

It will serve the storage backend API (consisting of `GET /todos`, `PUT /todo/:id` and `DELETE /todo/:id`) on port 8017 by default.

As of this writing, it is not a standalone server: the node.js app will only serve the API. You are expected to use an HTTPS server like nginx to serve the static files inside the 'front' directory, and, if you'd like to, reverse-proxy the API. You don't *have* to proxy the node app, though, since it implements CORS on its own.
For anything else than localhost, the nginx server *must* use HTTPS, otherwise the browser will refuse to use `crypto.subtle`.

## how does it work?

The server is basically an in-memory key-value store with a LRU cache mechanism to mitigate abuse (only the 2000 most recent messages will remain in storage). Each buffer is identified with a 12-byte number (chosen by the client) and limited to 5000 bytes. Both limits can be changed easily. The API accepts GET, PUT and DELETE from anyone, with any valid ID. The GET endpoint returns every message, concatenated in raw binary format (12 bytes for ID + 2 bytes for length + content).

On the client-side, a 128-bit AES key is generated the first time and stored in localStorage as JWK. You can copy-paste it to another browser's localStorage to share the same data (obviously not meant for real-world usage). The key is used to encrypt all messages with AES-GCM. The IV is a random 16-byte number, 12 of which make up the identifier for that message. The remaining 4 bytes are stored at the beginning of the buffer and incremented each time the content is updated, to avoid reusing the same IV.

When the app is loaded, it fetches everyone's messages (remember the server doesn't track users) and displays those it can decrypt with the local key. Thus, you only see your own messages.

## should I deploy this on my real-world, commercial website?

You should definitely implement client-side encryption if it is feasible for your use case, and you may find parts of my code useful, but in its current state this app lets anyone overwrite and delete anyone else's content (it just stops them from reading it first) so, no, probably not.

## license

[MIT](https://tldrlegal.com/license/mit-license)