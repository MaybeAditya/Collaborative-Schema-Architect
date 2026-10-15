import { useCallback, useEffect, useState } from 'react';
import SchemaDesigner from './SchemaDesigner';

function readRoomFromPath() {
    const match = window.location.pathname.match(/^\/room\/([^/]+)\/?$/);
    if (!match) return 'main';
    try {
        return decodeURIComponent(match[1]) || 'main';
    } catch {
        return 'main';
    }
}

function App() {
    const [roomId, setRoomId] = useState(readRoomFromPath);

    useEffect(() => {
        if (!/^\/room\/[^/]+\/?$/.test(window.location.pathname)) {
            window.history.replaceState({}, '', `/room/${encodeURIComponent(roomId)}`);
        }
        const onPopState = () => setRoomId(readRoomFromPath());
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []); // Intentionally configure the initial URL only.

    const changeRoom = useCallback((nextRoomId) => {
        window.history.pushState({}, '', `/room/${encodeURIComponent(nextRoomId)}`);
        setRoomId(nextRoomId);
    }, []);

    return <SchemaDesigner key={roomId} roomId={roomId} onChangeRoom={changeRoom} />;
}

export default App;
