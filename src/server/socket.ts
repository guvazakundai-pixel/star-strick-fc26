import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function getSocketIO(httpServer?: HTTPServer): SocketIOServer | null {
  if (io) return io;
  if (httpServer) {
    io = new SocketIOServer(httpServer, {
      cors: { origin: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000', methods: ['GET', 'POST'], credentials: true },
      transports: ['websocket', 'polling'],
    });
    io.on('connection', (socket) => {
      socket.on('join-league', (id: string) => socket.join(`league:${id}`));
      socket.on('leave-league', (id: string) => socket.leave(`league:${id}`));
      socket.on('join-tournament', (id: string) => socket.join(`tournament:${id}`));
      socket.on('match-update', (data: { matchId: string; leagueId?: string; tournamentId?: string }) => {
        if (data.leagueId) io?.to(`league:${data.leagueId}`).emit('match-updated', data);
        if (data.tournamentId) io?.to(`tournament:${data.tournamentId}`).emit('match-updated', data);
      });
      socket.on('standings-update', (data: { leagueId: string }) => {
        io?.to(`league:${data.leagueId}`).emit('standings-changed', data);
      });
      socket.on('disconnect', () => {});
    });
  }
  return io;
}
