import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { MonacoBinding } from 'y-monaco';

const CollabEditor = () => {
    const editorRef = useRef(null);
    const [status, setStatus] = useState('disconnected');
    const [language, setLanguage] = useState('javascript');

    // The shared document
    const ydoc = useRef(new Y.Doc()).current;
    const providerRef = useRef(null);

    useEffect(() => {
        const provider = new HocuspocusProvider({
            url: 'ws://127.0.0.1:1234',
            name: 'room-1', // We can make this dynamic later
            document: ydoc,
        });

        providerRef.current = provider;

        provider.on('status', (event) => {
            setStatus(event.status);
        });

        return () => {
            provider.destroy();
        };
    }, []);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        const yText = ydoc.getText('monaco');

        // Bind Yjs to Monaco
        new MonacoBinding(yText, editor.getModel(), new Set([editor]), providerRef.current.awareness);

        // Set random user color
        const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
        providerRef.current.awareness.setLocalStateField('user', {
            name: 'User ' + Math.floor(Math.random() * 100),
            color: randomColor
        });
    };

    // UI Styles (Simple inline styles for now)
    const styles = {
        container: { height: '100vh', display: 'flex', flexDirection: 'column', background: '#1e1e1e', fontFamily: 'sans-serif' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', background: '#252526', borderBottom: '1px solid #333' },
        title: { color: '#ccc', fontSize: '18px', fontWeight: 'bold' },
        controls: { display: 'flex', gap: '15px', alignItems: 'center' },
        statusDot: { height: '10px', width: '10px', borderRadius: '50%', background: status === 'connected' ? '#0f0' : 'red', display: 'inline-block', marginRight: '5px' },
        select: { padding: '5px', background: '#3c3c3c', color: 'white', border: 'none', borderRadius: '4px' },
        button: { padding: '6px 12px', background: '#007acc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }
    };

    return (
        <div style={styles.container}>
            {/* Navbar */}
            <div style={styles.header}>
                <div style={styles.title}>
                    ⚡ CollabIDE <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>v1.0</span>
                </div>

                <div style={styles.controls}>
                    {/* Language Selector */}
                    <select
                        style={styles.select}
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        <option value="javascript">JavaScript</option>
                        <option value="cpp">C++</option>
                        <option value="python">Python</option>
                    </select>

                    {/* Share Button */}
                    <button style={styles.button} onClick={() => alert('Room ID copied! (Feature coming soon)')}>
                        Share Room
                    </button>

                    {/* Status Indicator */}
                    <div style={{ color: '#aaa', fontSize: '14px' }}>
                        <span style={styles.statusDot}></span>
                        {status}
                    </div>
                </div>
            </div>

            {/* Editor Area */}
            <Editor
                height="90vh"
                language={language} // Dynamic language support
                defaultValue="// Start coding together..."
                theme="vs-dark"
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 16,
                }}
            />
        </div>
    );
};

export default CollabEditor;