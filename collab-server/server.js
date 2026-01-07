const { Server } = require('@hocuspocus/server');

// FIX: Use 'new Server' instead of 'Server.configure'
const server = new Server({
    port: 1234,
    async onConnect() {
        console.log('New client connected!');
    },
});

server.listen();
console.log('Hocuspocus (CRDT Server) running on port 1234');