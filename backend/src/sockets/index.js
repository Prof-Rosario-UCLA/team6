import gameState from '../services/gameState.js'

export default function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Connected: ${socket.id}`);

    socket.on('joinRoom', ({ roomId, username }) => {
      socket.data.username = username;
      socket.data.room = roomId;
      
      let room = gameState.getRoom(roomId);
      
      if (room) {

        if (room.players.includes(username)) {

          if (room.disconnectedPlayers && room.disconnectedPlayers.has(username)) {
            room.disconnectedPlayers.delete(username);
            console.log(`${username} reconnected to room ${roomId}`);

          } else {
              socket.emit('error', { message: 'username already taken in this room. please choose another' });
              return;
          }
            //socket.emit('error', { message: 'username already taken in this room. please choose another' });
            //return;
            gameState.addPlayer(roomId, username);
            console.log(`${username} joined room ${roomId}`);
          }
        
        
      }
      else{
        //make room if first user
        gameState.createRoom(roomId, username);
        room = gameState.getRoom(roomId);
        console.log(`${username} created room ${roomId}`);

      }
      socket.join(roomId);

      // emit that a user has just joined the room
      socket.to(roomId).emit('userJoined', { username });

      // emit full list
      // could use this for specific UI stuff
      // ex: only host has a start game button and the can enter prompt list
      console.log(`room size: ${gameState.getPlayers(roomId).length}`);
      console.log(`host: ${gameState.getRoom(roomId)?.host}`);
      socket.emit('playerList', {
        players: gameState.getPlayers(roomId),
        host: gameState.getRoom(roomId)?.host,
      });

    });

    socket.on('drawing', ({ roomId, stroke }) => {
      const username = socket.data.username;

      gameState.addStroke(roomId, username, stroke);

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

    /*
    socket.on('disconnect', () => {

      const username = socket.data.username;
      const roomId = socket.data.room;

      if (username && roomId) {
        const room = gameState.getRoom(roomId);
        const phase = gameState.getPhase(roomId);

        const wasHost = room.host === username;
        if (wasHost && phase === 'lobby'){
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
    */

    socket.on('disconnect', () => {
      const username = socket.data.username;
      const roomId = socket.data.room;

      if (username && roomId) {
        const room = gameState.getRoom(roomId);
        const phase = gameState.getPhase(roomId);

        if (!room) {
          console.log(`Room ${roomId} not found on disconnect.`);
          return;
        }

        const wasHost = room.host === username;

        if (phase === 'lobby') {
          if (wasHost) {
            // we are close the room if host leaves in lobby
            io.to(roomId).emit('roomClosed');
            io.in(roomId).socketsLeave(roomId);
            gameState.deleteRoom(roomId);
            console.log(`Host ${username} left. room ${roomId} closed.`);
          } else {
            gameState.removePlayer(roomId, username);
            io.to(roomId).emit('userLeft', { username });
            console.log(`${username} left room ${roomId} iin lobby.`);
          }
        } else {
          // this is just for drawing (well, not lobby) phase
          if (!room.disconnectedPlayers) room.disconnectedPlayers = new Set();
          room.disconnectedPlayers.add(username);

          io.to(roomId).emit('userDisconnected', { username });
          console.log(`${username} disconnected from room ${roomId} during phase ${phase}.`);
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

        // start voting phase and timer
        gameState.setPhase(roomId, 'voting');

        // automatically finish voting after 30 seconds
        setTimeout(() => {
          finishVoting(roomId);
        }, 30000);
      }, 30000);

    });

    socket.on('vote', ({ roomId, votedFor }) => {
      const username = socket.data.username;

      const success = gameState.registerVote(roomId, username, votedFor);
      if (!success) {
        socket.emit('error', { message: 'invalid vote. remember, you can only vote once and not for yourself' });
        return;
      }

      const room = gameState.getRoom(roomId);
      console.log(`${username} voted for ${votedFor} in room ${roomId}`);

      // end votine early if everyone has voted
      if (gameState.allVotesIn(roomId)) {
        finishVoting(roomId);
      }

    });


    socket.on('reconnectPlayer', ({ roomId, strokes }) => {
      const username = socket.data.username;
      if (!roomId || !username || !Array.isArray(strokes)) return;

      const room = gameState.getRoom(roomId);
      if (!room) return;

      // replace player strokes with full reconnect array
      room.drawings.set(username, strokes);

      // remove from disconnected players set
      room.disconnectedPlayers?.delete(username);

      console.log(`${username} reconnected to room ${roomId},  ${strokes.length} strokes updated`);

      // emit "syncDrawings" to let all players to sun their drawings
      io.to(roomId).emit('syncDrawings', gameState.getAllDrawings(roomId));
    });
    
  });

  function finishVoting(roomId) {

    const room = gameState.getRoom(roomId);
    if (!room || room.votingFinished) return;

    room.votingFinished = true;
    const tally = gameState.tallyVotes(roomId);

    let winner = null;
    let maxVotes = 0;

    for (let candidate in tally) {

      if (tally.hasOwnProperty(candidate)) {
        const votes = tally[candidate];

        if (votes > maxVotes) {
          maxVotes = votes;
          winner = candidate;
        }
      }
    }

    io.to(roomId).emit('votingEnded', {
      tally,
      winner,
      votes: maxVotes,
    });

    console.log(`Voting ended in room ${roomId}. Winner: ${winner}`);

    gameState.resetRound(roomId);
  }

}


