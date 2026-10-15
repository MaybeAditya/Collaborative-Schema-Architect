import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { normalizeColumn, SQL_TYPES } from './sqlGenerator';

const fieldStyle = {
    minWidth: 0,
    background: '#111820',
    border: '1px solid #374151',
    borderRadius: '4px',
    color: '#e5e7eb',
    fontSize: '11px',
    padding: '5px 6px',
    outline: 'none',
};

const TableNode = ({ id, data, selected }) => {
    return (
        <div className={`table-node${selected ? ' is-selected' : ''}`}>
            <div className="table-node-header">
                <input
                    aria-label="Table name"
                    className="table-name-input nodrag nopan"
                    value={data.label || ''}
                    onChange={(event) => data.onChangeLabel(event.target.value)}
                    onKeyDown={(event) => event.stopPropagation()}
                    title="Edit table name"
                />
                <button
                    type="button"
                    className="delete-table-button nodrag nopan"
                    onClick={() => data.onDeleteTable(id)}
                    title={`Delete ${data.label || 'table'}`}
                    aria-label={`Delete ${data.label || 'table'}`}
                >
                    ×
                </button>
            </div>

            <div className="table-node-body">
                {(data.columns || []).map((rawColumn, index) => {
                    const column = normalizeColumn(rawColumn);
                    return (
                        <div className="column-editor nodrag nopan" key={rawColumn.id || `${index}-${column.name}`}>
                            <div className="column-primary-row">
                                <input
                                    aria-label={`Column ${index + 1} name`}
                                    className="column-name-input"
                                    style={fieldStyle}
                                    value={column.name}
                                    onChange={(event) => data.onChangeColumn(index, { name: event.target.value })}
                                    onKeyDown={(event) => event.stopPropagation()}
                                    placeholder="column_name"
                                    title="Column name"
                                />
                                <button
                                    type="button"
                                    className="delete-column-button"
                                    onClick={() => data.onDeleteColumn(index)}
                                    title={`Delete column ${column.name}`}
                                    aria-label={`Delete column ${column.name}`}
                                >
                                    ×
                                </button>
                            </div>
                            <div className="column-options-row">
                                <select
                                    aria-label={`Column ${index + 1} type`}
                                    className="column-type-select"
                                    style={fieldStyle}
                                    value={column.type}
                                    onChange={(event) => data.onChangeColumn(index, { type: event.target.value })}
                                    title="SQL data type"
                                >
                                    {SQL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                                </select>
                                <label className="column-flag" title="Primary key">
                                    <input
                                        type="checkbox"
                                        checked={column.primaryKey}
                                        onChange={(event) => data.onChangeColumn(index, { primaryKey: event.target.checked })}
                                    />
                                    PK
                                </label>
                                <label className="column-flag" title="Not null">
                                    <input
                                        type="checkbox"
                                        checked={column.notNull}
                                        onChange={(event) => data.onChangeColumn(index, { notNull: event.target.checked })}
                                    />
                                    NN
                                </label>
                            </div>
                        </div>
                    );
                })}

                <button type="button" className="add-column-button nodrag nopan" onClick={() => data.onAddColumn(id)}>
                    + Add column
                </button>
            </div>

            <Handle type="target" position={Position.Left} className="schema-handle" />
            <Handle type="source" position={Position.Right} className="schema-handle" />
        </div>
    );
};

export default memo(TableNode);
