import test from 'node:test';
import assert from 'node:assert/strict';
import { generateSQL, normalizeColumn } from './sqlGenerator.js';

const table = (id, label, columns) => ({ id, data: { label, columns } });

test('returns a helpful message for an empty schema', () => {
    assert.match(generateSQL([], []), /No tables yet/);
});

test('generates quoted columns with primary key and NOT NULL constraints', () => {
    const sql = generateSQL([
        table('users', 'users', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'display name', type: 'TEXT', notNull: true },
        ]),
    ]);

    assert.match(sql, /CREATE TABLE "users"/);
    assert.match(sql, /"id" INTEGER PRIMARY KEY/);
    assert.match(sql, /"display name" TEXT NOT NULL/);
    assert.match(sql, /\n\);/);
    assert.doesNotMatch(sql, /,\s*\n\);/);
});

test('normalizes the original legacy INT PK column shape', () => {
    assert.deepEqual(normalizeColumn({ name: 'id', type: 'INT PK' }), {
        name: 'id',
        type: 'INTEGER',
        primaryKey: true,
        notNull: false,
    });
});

test('escapes double quotes inside table and column identifiers', () => {
    const sql = generateSQL([
        table('one', 'odd"table', [{ name: 'odd"column', type: 'TEXT' }]),
    ]);
    assert.match(sql, /CREATE TABLE "odd""table"/);
    assert.match(sql, /"odd""column" TEXT/);
});

test('generates a foreign key only when the source has a primary key', () => {
    const sql = generateSQL(
        [
            table('users', 'Users', [{ name: 'id', type: 'INTEGER', primaryKey: true }]),
            table('orders', 'Orders', [{ name: 'id', type: 'INTEGER', primaryKey: true }]),
        ],
        [{ id: 'edge-users-orders', source: 'users', target: 'orders' }],
    );
    assert.match(sql, /"users_id" INTEGER/);
    assert.match(sql, /FOREIGN KEY \("users_id"\) REFERENCES "Users" \("id"\)/);

    const invalidReference = generateSQL(
        [table('a', 'A', [{ name: 'name', type: 'TEXT' }]), table('b', 'B', [{ name: 'id', type: 'INTEGER' }])],
        [{ id: 'edge-a-b', source: 'a', target: 'b' }],
    );
    assert.doesNotMatch(invalidReference, /FOREIGN KEY/);
});

test('supports composite primary keys and does not create invalid empty tables', () => {
    const sql = generateSQL([
        table('memberships', 'memberships', [
            { name: 'user_id', type: 'INTEGER', primaryKey: true },
            { name: 'team_id', type: 'INTEGER', primaryKey: true },
        ]),
        table('empty', 'empty', []),
    ]);
    assert.match(sql, /PRIMARY KEY \("user_id", "team_id"\)/);
    assert.match(sql, /Skipped empty/);
    assert.doesNotMatch(sql, /CREATE TABLE "empty"/);
});


test('flags duplicate table and column names instead of generating invalid DDL', () => {
    const duplicateColumnsSql = generateSQL([
        table('users', 'users', [
            { name: 'id', type: 'INTEGER', primaryKey: true },
            { name: 'id', type: 'TEXT' },
        ]),
    ]);
    assert.match(duplicateColumnsSql, /duplicate column name/);
    assert.doesNotMatch(duplicateColumnsSql, /CREATE TABLE "users"/);

    const duplicateTablesSql = generateSQL([
        table('one', 'items', [{ name: 'id', type: 'INTEGER', primaryKey: true }]),
        table('two', 'items', [{ name: 'id', type: 'INTEGER', primaryKey: true }]),
    ]);
    assert.match(duplicateTablesSql, /another table already uses this name/);
    assert.equal((duplicateTablesSql.match(/CREATE TABLE "items"/g) || []).length, 1);
});


test('does not create an invalid single-column foreign key to a composite primary key', () => {
    const sql = generateSQL(
        [
            table('parents', 'parents', [
                { name: 'tenant_id', type: 'INTEGER', primaryKey: true },
                { name: 'id', type: 'INTEGER', primaryKey: true },
            ]),
            table('children', 'children', [{ name: 'id', type: 'INTEGER', primaryKey: true }]),
        ],
        [{ id: 'edge', source: 'parents', target: 'children' }],
    );
    assert.match(sql, /composite primary keys need an explicit multi-column relationship/);
    assert.doesNotMatch(sql, /FOREIGN KEY/);
});
