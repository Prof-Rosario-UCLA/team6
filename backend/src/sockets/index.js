import gameState from '../services/gameState.js'

export default function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Connected: ${socket.id}`);

    socket.on('joinRoom', ({ roomId, username }) => {
      socket.data.username = username;
      socket.data.room = roomId;
      
      const room = gameState.getRoom(roomId);

      
      if (room) {
        gameState.addPlayer(roomId, username);
        // TODO: check name duplicates, we can't have duplicate names
        // primpt user with "name exists, enter a new one"
        console.log(`${username} joined room ${roomId}`);
      }
      else{
        //make room if first user
        gameState.createRoom(roomId, username);
        console.log(`${username} created room ${roomId}`);

      }
      socket.join(roomId);

      // emit that a user has just joined the room
      socket.to(roomId).emit('userJoined', { username });

      // emit full list
      // could use this for specific UI stuff
      // ex: only host has a start game button and the can enter prompt list
      socket.emit('playerList', {
        players: gameState.getPlayers(roomId),
        host: gameState.getRoom(roomId)?.host,
      });

    });

    socket.on('drawing', ({ roomId, stroke }) => {
      socket.to(roomId).emit('drawing', {
        username: socket.data.username,
        stroke
      });
    });

    socket.on('chatMessage', ({ roomId, message }) => {
      socket.to(roomId).emit('chatMessage', {
        username: socket.data.username,
        message
      });
    });

    socket.on('disconnect', () => {

      const username = socket.data.username;
      const roomId = socket.data.room;

      if (username && roomId) {
        const room = gameState.getRoom(roomId);

        const wasHost = room.host === username;
        if (wasHost){
          // we are closing the room
          io.to(roomId).emit('roomClosed');

          //kick everyone out
          io.in(roomId).socketsLeave(roomId);
          console.log(`Host ${username} left. Room ${roomId} closed.`);

        }
        else{
          io.to(roomId).emit('userLeft', { username });
          console.log(`${username} left room ${roomId}`);
        }
      }


      console.log(`Disconnected: ${socket.id}`);
    });


    socket.on('startGame', ({ roomId }) => {

      const room = gameState.getRoom(roomId);
      const username = socket.data.username;

      if (!room) return;
      if (room.host !== username) {
        socket.emit('error', { message: 'Only the host can start the game' });
        // this is just in case. but ideally the start button wouldn't even be there for no hosts.
        return;
      }

      const prompt = gameState.getPrompt(roomId);

      if (!prompt) {
        // this should never happen anyways
        socket.emit('error', { message: 'No prompts given' });
        return;
      }

      gameState.setPhase(roomId, 'drawing');

      io.to(roomId).emit('gameStarted', {
        prompt,
        duration: 30, // 30 second timer. im hardcoding it to keep demos short.
      });

      console.log(`game started in room ${roomId} with promtp: ${prompt}`);

      setTimeout(() => {
        // emit that drawing phase had ended after timer runs out
        io.to(roomId).emit('drawingEnded');
        gameState.setPhase(roomId, 'voting');
      }, 30000);

    });
  });





}
