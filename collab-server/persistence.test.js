const test = require('node:test');
const assert = require('node:assert/strict');
const Y = require('yjs');
const { createSQLitePersistence } = require('./sqlitePersistence');

test('persists and restores a Yjs document by room name', async () => {
  const persistence = createSQLitePersistence(':memory:');
  try {
    const original = new Y.Doc();
    original.getMap('schema').set('title', 'orders');
    original.getArray('columns').push([{ name: 'id', type: 'INTEGER' }]);

    await persistence.onStoreDocument({ documentName: 'schema-room:test', document: original });

    const restored = new Y.Doc();
    await persistence.onLoadDocument({ documentName: 'schema-room:test', document: restored });
    assert.equal(restored.getMap('schema').get('title'), 'orders');
    assert.deepEqual(restored.getArray('columns').toArray(), [{ name: 'id', type: 'INTEGER' }]);

    const otherRoom = new Y.Doc();
    await persistence.onLoadDocument({ documentName: 'schema-room:other', document: otherRoom });
    assert.equal(otherRoom.getMap('schema').get('title'), undefined);
  } finally {
    persistence.close();
  }
});
