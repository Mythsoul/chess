import io from 'socket.io-client';

const socket = io(String(import.meta.env.VITE_SOCKET_SERVER), {
  transports: ['websocket'],
  reconnectionAttempts: 5
});

export default socket;
