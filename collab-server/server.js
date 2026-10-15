const path = require('node:path');
const { Server } = require('@hocuspocus/server');
const { createSQLitePersistence } = require('./sqlitePersistence');

const port = Number(process.env.PORT) || 1234;
const persistence = createSQLitePersistence(
  process.env.SQLITE_DATABASE || path.join(__dirname, 'data', 'schema-documents.sqlite'),
);

const server = new Server({
  port,
  stopOnSignals: false,
  onLoadDocument: persistence.onLoadDocument,
  onStoreDocument: persistence.onStoreDocument,
  async onConnect({ documentName }) {
    console.log(`[connection] Client joined "${documentName}"`);
  },
});

server.listen();
console.log(`Hocuspocus listening on port ${port}`);
console.log(`SQLite document persistence: ${persistence.databasePath}`);

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  // Flush active rooms once more before the database handle is closed.
  for (const [documentName, document] of server.hocuspocus.documents.entries()) {
    try {
      await persistence.onStoreDocument({ documentName, document });
    } catch (error) {
      console.error(`[shutdown] Could not persist room "${documentName}":`, error);
    }
  }
  try {
    await server.destroy();
  } catch (error) {
    console.error('[shutdown] Hocuspocus shutdown failed:', error);
  } finally {
    try {
      persistence.close();
    } catch (error) {
      console.error('[shutdown] Could not close SQLite:', error);
    }
    process.exit(0);
  }
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
