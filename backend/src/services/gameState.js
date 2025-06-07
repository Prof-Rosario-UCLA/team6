const rooms = new Map();


function createRoom(roomId, host) {
  rooms.set(roomId, {
    host,
    players: new Map([[host, { username: host, score: 0 }]]),
    prompts: [],
    currentPrompt: null,
    drawings: new Map(), // username : drawing
    votes: new Map(),    // username : votedUsername
    history: [],         // aray of past rounds
    phase: 'lobby',      // can  be 'lobby', 'drawing', 'voting', 'results' like in the frontend
  });
}


function deleteRoom(roomId) {
  rooms.delete(roomId);
}


function addPlayer(roomId, username) {
  const room = rooms.get(roomId);
  if (room) {
    room.players.set(username, { username, score: 0 });
  }
}


function removePlayer(roomId, username) {
  const room = rooms.get(roomId);
  if(room) {
    room.players.delete(username);
    if(username === room.host) {
      
      // close room if the host leaves
      deleteRoom(roomId);
      a
    }
  }
}


function getPlayers(roomId) {

  return Array.from(rooms.get(roomId)?.players.values() || []);
}


function setPrompts(roomId, prompts) {

  const room = rooms.get(roomId);
   if (room) {
    room.prompts = prompts;
  }
}


function getPrompt(roomId) {

  const room = rooms.get(roomId);
  if(room && room.prompts.length) {
    const random = Math.floor(Math.random() * room.prompts.length);
    const prompt = room.prompts[random];
    room.currentPrompt = prompt;
    return prompt;
  }
  return null;
}


function getRoom(roomId) {

  return rooms.get(roomId);
}


function addDrawing(roomId, username, drawingData) {

  const room = rooms.get(roomId);
  if (room) {
    room.drawings.set(username, drawingData);
  }
}

/**
 * Stores a vote by a player.
 */
function addVote(roomId, voter, votedFor) {
  const room = rooms.get(roomId);
  if(room) {
    room.votes.set(voter, votedFor);
  }
}


// Resets the current game phase and data for a new round.
function resetRound(roomId) {
  const room = rooms.get(roomId);
  if(room) {
    // Save history
    room.history.push({
      prompt: room.currentPrompt,
      drawings: Object.fromEntries(room.drawings),
      votes: Object.fromEntries(room.votes),
    });

    // Reset for next round
    room.currentPrompt = null;
    room.drawings = new Map();
    room.votes = new Map();
    room.phase = 'lobby';
  }
}

// Sets the current phase (drawing, voting etc)
function setPhase(roomId, phase) {
  const room = rooms.get(roomId);
  if(room) {
    room.phase = phase;
  }
}

function getPhase(roomId) {
  return rooms.get(roomId)?.phase;
}


//gets previous round histroy
function getHistory(roomId) {
  return rooms.get(roomId)?.history || [];
}

export default {
  createRoom,
  deleteRoom,
  addPlayer,
  removePlayer,
  getPlayers,
  setPrompts,
  getPrompt,
  getRoom,
  addDrawing,
  addVote,
  resetRound,
  setPhase,
  getPhase,
  getHistory,
};
