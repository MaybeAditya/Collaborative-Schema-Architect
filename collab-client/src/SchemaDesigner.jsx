import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    Background,
    Controls,
    MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { IndexeddbPersistence } from 'y-indexeddb';
import TableNode from './TableNode';
import { generateSQL, normalizeColumn } from './sqlGenerator';

const nodeTypes = { table: TableNode };
const createId = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`;
const randomColor = () => `hsl(${Math.floor(Math.random() * 360)} 75% 62%)`;

function getDisplayNode(node, actions) {
    const data = node.data || {};
    return {
        ...node,
        data: {
            ...data,
            label: data.label == null ? 'Untitled_Table' : data.label,
            columns: (Array.isArray(data.columns) ? data.columns : []).map(normalizeColumn),
            ...actions,
        },
    };
}

const SchemaDesigner = ({ roomId, onChangeRoom }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [sqlCode, setSqlCode] = useState('-- Connecting to room…\n');
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const [participants, setParticipants] = useState([]);
    const [copyLabel, setCopyLabel] = useState('Copy room link');

    const ydoc = useMemo(() => new Y.Doc(), [roomId]);
    const yNodesMap = useRef(null);
    const yEdgesMap = useRef(null);
    const providerRef = useRef(null);

    const updateSql = useCallback((nodeValues, edgeValues) => {
        setSqlCode(generateSQL(nodeValues, edgeValues));
    }, []);

    const updateNodeLabel = useCallback((id, newLabel) => {
        const currentNode = yNodesMap.current?.get(id);
        if (!currentNode) return;
        yNodesMap.current.set(id, {
            ...currentNode,
            data: { ...currentNode.data, label: newLabel },
        });
    }, []);

    const updateColumn = useCallback((id, columnIndex, changes) => {
        const currentNode = yNodesMap.current?.get(id);
        if (!currentNode) return;
        const columns = (currentNode.data?.columns || []).map(normalizeColumn);
        if (!columns[columnIndex]) return;
        columns[columnIndex] = normalizeColumn({ ...columns[columnIndex], ...changes });
        yNodesMap.current.set(id, {
            ...currentNode,
            data: { ...currentNode.data, columns },
        });
    }, []);

    const addColumn = useCallback((id) => {
        const currentNode = yNodesMap.current?.get(id);
        if (!currentNode) return;
        const existing = (currentNode.data?.columns || []).map(normalizeColumn);
        let index = existing.length + 1;
        let name = `new_column_${index}`;
        while (existing.some((column) => column.name.toLowerCase() === name.toLowerCase())) {
            index += 1;
            name = `new_column_${index}`;
        }
        yNodesMap.current.set(id, {
            ...currentNode,
            data: { ...currentNode.data, columns: [...existing, { name, type: 'TEXT', primaryKey: false, notNull: false }] },
        });
    }, []);

    const deleteColumn = useCallback((id, columnIndex) => {
        const currentNode = yNodesMap.current?.get(id);
        if (!currentNode) return;
        const columns = (currentNode.data?.columns || []).filter((_, index) => index !== columnIndex).map(normalizeColumn);
        yNodesMap.current.set(id, {
            ...currentNode,
            data: { ...currentNode.data, columns },
        });
    }, []);

    const deleteTable = useCallback((id) => {
        ydoc.transact(() => {
            yNodesMap.current?.delete(id);
            if (yEdgesMap.current) {
                for (const [edgeId, edge] of Array.from(yEdgesMap.current.entries())) {
                    if (edge.source === id || edge.target === id) yEdgesMap.current.delete(edgeId);
                }
            }
        });
    }, [ydoc]);

    const updatePresence = useCallback(() => {
        const provider = providerRef.current;
        if (!provider?.awareness) return;
        const online = Array.from(provider.awareness.getStates().entries())
            .map(([clientId, state]) => ({
                clientId,
                name: String(state?.user?.name || 'Collaborator').slice(0, 32),
                color: String(state?.user?.color || '#8b949e'),
            }))
            .filter((person) => person.name);
        setParticipants(online);
    }, []);

    useEffect(() => {
        const localPersistence = new IndexeddbPersistence(`schema-room:${roomId}`, ydoc);
        const nodesMap = ydoc.getMap('project-nodes');
        const edgesMap = ydoc.getMap('project-edges');
        yNodesMap.current = nodesMap;
        yEdgesMap.current = edgesMap;

        const makeActions = (id) => ({
            onChangeLabel: (value) => updateNodeLabel(id, value),
            onChangeColumn: (index, changes) => updateColumn(id, index, changes),
            onAddColumn: () => addColumn(id),
            onDeleteColumn: (index) => deleteColumn(id, index),
            onDeleteTable: () => deleteTable(id),
        });

        const syncNodes = () => {
            const rawNodes = Array.from(nodesMap.values());
            const displayNodes = rawNodes.map((node) => getDisplayNode(node, makeActions(node.id)));
            setNodes(displayNodes);
            updateSql(rawNodes, Array.from(edgesMap.values()));
        };
        const syncEdges = () => {
            const edgeValues = Array.from(edgesMap.values());
            setEdges(edgeValues);
            updateSql(Array.from(nodesMap.values()), edgeValues);
        };

        nodesMap.observe(syncNodes);
        edgesMap.observe(syncEdges);

        const provider = new HocuspocusProvider({
            url: import.meta.env.VITE_COLLAB_URL || 'ws://127.0.0.1:1234',
            name: `schema-room:${roomId}`,
            document: ydoc,
        });
        providerRef.current = provider;

        provider.on('status', ({ status }) => setConnectionStatus(status));
        const userNumber = Math.floor(1000 + Math.random() * 9000);
        provider.awareness.setLocalStateField('user', {
            name: `Designer ${userNumber}`,
            color: randomColor(),
        });
        provider.awareness.on('change', updatePresence);
        updatePresence();

        // Render existing state, including anything restored from local IndexedDB.
        syncNodes();
        syncEdges();

        return () => {
            nodesMap.unobserve(syncNodes);
            edgesMap.unobserve(syncEdges);
            provider.awareness.off('change', updatePresence);
            provider.destroy();
            localPersistence.destroy();
            providerRef.current = null;
            yNodesMap.current = null;
            yEdgesMap.current = null;
        };
    }, [
        roomId, ydoc, setNodes, setEdges, updateSql, updateNodeLabel, updateColumn,
        addColumn, deleteColumn, deleteTable, updatePresence,
    ]);

    const handleNodesChange = useCallback((changes) => {
        onNodesChange(changes);
        changes.forEach((change) => {
            if (change.type === 'position' && change.position && change.dragging !== true) {
                const currentNode = yNodesMap.current?.get(change.id);
                if (currentNode && (
                    currentNode.position?.x !== change.position.x ||
                    currentNode.position?.y !== change.position.y
                )) {
                    yNodesMap.current.set(change.id, {
                        ...currentNode,
                        position: { ...change.position },
                    });
                }
            }

            if (change.type === 'remove') {
                deleteTable(change.id);
            }
        });
    }, [onNodesChange, deleteTable]);

    const handleEdgesChange = useCallback((changes) => {
        onEdgesChange(changes);
        changes.forEach((change) => {
            if (change.type === 'remove') yEdgesMap.current?.delete(change.id);
        });
    }, [onEdgesChange]);

    const onConnect = useCallback((params) => {
        if (!yEdgesMap.current || params.source === params.target) return;
        const edgeId = `edge-${params.source}-${params.target}`;
        yEdgesMap.current.set(edgeId, {
            ...params,
            id: edgeId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#18a6f6', strokeWidth: 1.5 },
        });
    }, []);

    const addTable = useCallback(() => {
        const currentNodes = Array.from(yNodesMap.current?.values() || []);
        const id = createId('table');
        const columns = [{ name: 'id', type: 'INTEGER', primaryKey: true, notNull: false }];
        const columnIndex = currentNodes.length;
        const column = columnIndex % 3;
        const row = Math.floor(columnIndex / 3);
        const existingLabels = new Set(currentNodes.map((node) => String(node.data?.label || '').toLowerCase()));
        let label = 'Untitled_Table';
        let suffix = 2;
        while (existingLabels.has(label.toLowerCase())) {
            label = `Untitled_Table_${suffix}`;
            suffix += 1;
        }
        const newNode = {
            id,
            type: 'table',
            position: { x: 80 + column * 360, y: 90 + row * 300 },
            data: { label, columns },
        };
        yNodesMap.current?.set(id, newNode);
    }, []);

    const copyRoomLink = async () => {
        const url = `${window.location.origin}/room/${encodeURIComponent(roomId)}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopyLabel('Link copied!');
            window.setTimeout(() => setCopyLabel('Copy room link'), 1600);
        } catch {
            window.prompt('Copy this room link to share the schema:', url);
        }
    };

    const createNewRoom = () => {
        const newRoomId = Math.random().toString(36).slice(2, 9);
        onChangeRoom(newRoomId);
    };

    return (
        <main className="app-shell">
            <header className="topbar">
                <div className="brand-block">
                    <div className="brand-mark">S</div>
                    <div>
                        <div className="brand-title">Schema Architect</div>
                        <div className="brand-subtitle">Real-time collaborative database design</div>
                    </div>
                </div>
                <div className="room-tools">
                    <div className="room-chip"><span className="room-dot" />Room <strong>{roomId}</strong></div>
                    <div className={`connection-state ${connectionStatus === 'connected' ? 'connected' : ''}`}>
                        <span />{connectionStatus}
                    </div>
                    <button className="button button-secondary" onClick={copyRoomLink}>{copyLabel}</button>
                    <button className="button button-primary" onClick={createNewRoom}>New room</button>
                </div>
            </header>

            <div className="workspace">
                <section className="canvas-panel" aria-label="Schema canvas">
                    <div className="canvas-toolbar">
                        <div>
                            <h1>Schema canvas</h1>
                            <p>Drag to arrange · Connect handles to create foreign-key relationships</p>
                        </div>
                        <button className="button button-primary" onClick={addTable}>＋ Add table</button>
                    </div>
                    <div className="canvas-flow">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={nodeTypes}
                            onNodesChange={handleNodesChange}
                            onEdgesChange={handleEdgesChange}
                            onConnect={onConnect}
                            deleteKeyCode={['Backspace', 'Delete']}
                            fitView
                            fitViewOptions={{ padding: 0.18 }}
                            minZoom={0.15}
                            maxZoom={2}
                        >
                            <Background color="#27313e" gap={22} size={1} />
                            <Controls />
                            <MiniMap
                                pannable
                                zoomable
                                maskColor="rgba(8, 12, 18, 0.72)"
                                style={{ background: '#0d131c', border: '1px solid #283545' }}
                                nodeColor="#087fca"
                            />
                        </ReactFlow>
                        {nodes.length === 0 && (
                            <div className="empty-canvas">
                                <div className="empty-icon">⌘</div>
                                <h2>Start with a table</h2>
                                <p>Add your first table, edit its columns, and connect tables to model relationships.</p>
                                <button className="button button-primary" onClick={addTable}>＋ Create first table</button>
                            </div>
                        )}
                    </div>
                </section>

                <aside className="sql-panel">
                    <div className="sql-header">
                        <div>
                            <div className="panel-kicker">OUTPUT</div>
                            <h2>Generated SQL</h2>
                        </div>
                        <button
                            className="copy-sql-button"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(sqlCode);
                                } catch {
                                    window.prompt('Copy generated SQL:', sqlCode);
                                }
                            }}
                            title="Copy generated SQL"
                        >
                            Copy SQL
                        </button>
                    </div>
                    <p className="sql-description">Updates as you edit the schema.</p>
                    <pre className="sql-code"><code>{sqlCode}</code></pre>
                    <div className="sql-footer">Review generated SQL before running it against a real database.</div>
                </aside>
            </div>

            <footer className="statusbar">
                <div className="status-summary"><span className="status-indicator" />{nodes.length} tables <span className="status-separator">·</span> {edges.length} relationships</div>
                <div className="presence-list" aria-label="People in this room">
                    <span className="presence-label">IN ROOM</span>
                    {participants.slice(0, 4).map((person) => (
                        <span className="presence-avatar" key={person.clientId} style={{ background: person.color }} title={person.name}>
                            {person.name.slice(0, 1).toUpperCase()}
                        </span>
                    ))}
                    {participants.length > 4 && <span className="presence-more">+{participants.length - 4}</span>}
                    <span className="presence-count">{participants.length} online</span>
                </div>
            </footer>
        </main>
    );
};

export default SchemaDesigner;
