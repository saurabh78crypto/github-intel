import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket || !socket.connected) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socket.on('connect', () =>
      console.log('[socket] connected', socket?.id),
    );
    socket.on('disconnect', (reason) =>
      console.warn('[socket] disconnected', reason),
    );
    socket.on('connect_error', (err) =>
      console.error('[socket] connection error', err.message),
    );
  }
  return socket;
}

export function refreshSocket(): Socket {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  return getSocket();
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}