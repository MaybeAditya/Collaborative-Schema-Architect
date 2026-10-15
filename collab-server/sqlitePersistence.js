const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const Y = require('yjs');

/**
 * Create SQLite persistence for a Hocuspocus document store.
 * The returned load/store callbacks follow the same binary-state fetch/store
 * contract used by Hocuspocus's generic database extension.
 */
function createSQLitePersistence(configuredPath = './data/schema-documents.sqlite') {
  const databasePath = configuredPath === ':memory:' ? ':memory:' : path.resolve(configuredPath);

  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      name TEXT PRIMARY KEY NOT NULL,
      data BLOB NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const readDocument = database.prepare('SELECT data FROM documents WHERE name = ?');
  const writeDocument = database.prepare(`
    INSERT INTO documents (name, data, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(name) DO UPDATE SET
      data = excluded.data,
      updated_at = excluded.updated_at
  `);

  return {
    databasePath,
    async onLoadDocument({ documentName, document }) {
      const saved = readDocument.get(documentName);
      if (saved?.data) {
        Y.applyUpdate(document, Buffer.from(saved.data));
      }
    },
    async onStoreDocument({ documentName, document }) {
      const encodedState = Buffer.from(Y.encodeStateAsUpdate(document));
      writeDocument.run(documentName, encodedState);
    },
    close() {
      database.close();
    },
  };
}

module.exports = { createSQLitePersistence };
