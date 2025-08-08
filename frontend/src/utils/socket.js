import io from 'socket.io-client';

const socket = io(String(import.meta.env.VITE_SOCKET_SERVER), {
  transports: ['websocket'],
  reconnectionAttempts: 5
});

// Debug socket connection
socket.on('connect', () => {
  console.log('🔌 Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('🔌 Socket disconnected');
});

socket.on('connect_error', (error) => {
  console.error('🔌 Socket connection error:', error);
});

socket.on('reconnect', () => {
  console.log('🔌 Socket reconnected:', socket.id);
});

// Debug all events
socket.onAny((event, ...args) => {
  console.log('📞 Received socket event:', event, args);
});

export default socket;
