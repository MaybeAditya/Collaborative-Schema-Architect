const { Server } = require('@hocuspocus/server');

// Render and other hosting providers inject PORT at runtime.
const port = Number(process.env.PORT) || 1234;

const server = new Server({
  port,
  async onConnect() {
    console.log('New client connected!');
  },
});

server.listen();
console.log(`Hocuspocus (CRDT Server) listening on port ${port}`);
