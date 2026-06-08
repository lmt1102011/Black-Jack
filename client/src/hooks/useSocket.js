import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { CLIENT_EVENTS, SERVER_EVENTS } from '@blackjack/shared';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function useSocket(profile, getToken) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [lobby, setLobby] = useState([]);
  const [table, setTable] = useState(null);
  const [notice, setNotice] = useState(null);
  const [messages, setMessages] = useState([]);
  const [remotePeeks, setRemotePeeks] = useState({});

  useEffect(() => {
    if (!profile) return undefined;

    let disposed = false;

    async function connect() {
      const token = await getToken();
      if (disposed) return;

      const socket = io(apiUrl, {
        auth: {
          token,
          guestId: profile.isGuest ? profile.id : undefined,
          guestName: profile.username
        },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 2500
      });

      socketRef.current = socket;
      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));
      socket.on(SERVER_EVENTS.lobbyUpdate, setLobby);
      socket.on(SERVER_EVENTS.tableState, (state) => setTable(state));
      socket.on(SERVER_EVENTS.cardPeek, (peek) => {
        const key = `${peek.tableId}:${peek.seatId}:${peek.handId}:${peek.cardIndex}`;
        if (!peek.active) {
          setRemotePeeks((current) => {
            const next = { ...current };
            delete next[key];
            return next;
          });
          return;
        }

        const stamp = Date.now();
        setRemotePeeks((current) => ({ ...current, [key]: stamp }));
        window.setTimeout(() => {
          setRemotePeeks((current) => {
            if (current[key] !== stamp) return current;
            const next = { ...current };
            delete next[key];
            return next;
          });
        }, 3500);
      });
      socket.on(SERVER_EVENTS.tableError, (error) => setNotice({ type: 'error', ...error }));
      socket.on(SERVER_EVENTS.toast, setNotice);
      socket.on(CLIENT_EVENTS.chatMessage, (message) => {
        setMessages((current) => [...current.slice(-60), message]);
      });
    }

    connect();

    return () => {
      disposed = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      setTable(null);
      setMessages([]);
      setRemotePeeks({});
    };
  }, [getToken, profile]);

  const emit = useCallback((event, payload) => {
    socketRef.current?.emit(event, payload);
  }, []);

  const actions = useMemo(() => ({
    requestLobby: () => emit(CLIENT_EVENTS.lobbyList),
    quickMatch: () => emit(CLIENT_EVENTS.quickMatch),
    createPrivate: () => emit(CLIENT_EVENTS.createPrivate),
    joinTable: (tableId) => emit(CLIENT_EVENTS.joinTable, { tableId }),
    joinCode: (code) => emit('table:joinCode', { code }),
    spectate: (code) => emit(CLIENT_EVENTS.spectateTable, { code }),
    leaveTable: (tableId) => emit(CLIENT_EVENTS.leaveTable, { tableId }),
    placeBet: (tableId, amount) => emit(CLIENT_EVENTS.placeBet, { tableId, amount }),
    playerAction: (tableId, action) => emit(CLIENT_EVENTS.playerAction, { tableId, action }),
    cardPeek: (tableId, handId, cardIndex, active) => emit(CLIENT_EVENTS.cardPeek, { tableId, handId, cardIndex, active }),
    sendChat: (tableId, text) => emit(CLIENT_EVENTS.chatMessage, { tableId, text })
  }), [emit]);

  return {
    connected,
    lobby,
    table,
    notice,
    messages,
    remotePeeks,
    clearNotice: () => setNotice(null),
    actions
  };
}
