export default function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Connected: ${socket.id}`);

    socket.on('joinRoom', ({ roomId, username }) => {
      socket.join(roomId);
      console.log(`${username} joined room ${roomId}`);
      socket.to(roomId).emit('userJoined', { username });
    });

    socket.on('drawing', ({ roomId, stroke }) => {
      socket.to(roomId).emit('drawing', stroke);
    });

    socket.on('voteClick', ({ roomId, message }) => {
      socket.to(roomId).emit('voteClick', message);
    });

    socket.on('disconnect', () => {
      console.log(`Disconnected: ${socket.id}`);
    });
  });
}
