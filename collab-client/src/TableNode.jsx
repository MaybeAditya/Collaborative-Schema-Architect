import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const TableNode = ({ data }) => {
    return (
        <div style={{
            background: '#1e1e1e',
            border: '1px solid #444',
            borderRadius: '8px',
            minWidth: '220px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
            color: 'white',
            fontFamily: 'JetBrains Mono, monospace'
        }}>
            {/* 1. EDITABLE HEADER */}
            <div style={{
                padding: '8px',
                background: '#007acc',
                borderTopLeftRadius: '7px',
                borderTopRightRadius: '7px',
                borderBottom: '1px solid #005f9e'
            }}>
                {/* The 'nodrag' class stops ReactFlow from moving the node when you type */}
                <input
                    className="nodrag"
                    value={data.label}
                    onChange={(e) => data.onChangeLabel(e.target.value)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        width: '100%',
                        outline: 'none'
                    }}
                />
            </div>

            {/* 2. DYNAMIC COLUMNS */}
            <div style={{ padding: '10px' }}>
                {data.columns.map((col, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                        <span style={{ color: '#9cdcfe' }}>{col.name}</span>
                        <span style={{ color: '#ce9178' }}>{col.type}</span>
                    </div>
                ))}

                {/* Add Column Button (Visual for now) */}
                <div
                    onClick={data.onAddColumn}
                    style={{ fontSize: '11px', color: '#6a9955', marginTop: '8px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                    + Add Column
                </div>
            </div>

            {/* 3. HANDLES (The Connectors) */}
            <Handle type="target" position={Position.Left} style={{ width: 10, height: 10, background: '#fff' }} />
            <Handle type="source" position={Position.Right} style={{ width: 10, height: 10, background: '#fff' }} />
        </div>
    );
};

export default memo(TableNode);