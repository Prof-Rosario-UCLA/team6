// TODO:
// DB and caching code, right now everything is stored locally
// LATER, rename file from gameState.js to service.js, since
// it is doing more than just game logic

import { fetchHistoryFromCache, cacheHistory } from './cache.js';

const rooms = new Map();

function createRoom(roomId, hostName) {
  rooms.set(roomId, {
    host: hostName,
    players: [hostName],
    prompts: [],
    currentPrompt: null,
    drawings: new Map(), // username : drawing
    votes: new Map(),    // username : votedUsername
    history: [],         // aray of past rounds
    phase: 'lobby',      // can  be 'lobby', 'drawing', 'voting', 'results' like in the frontend
    votingFinished: false,
    disconnectedPlayers: new Set() // this is for drawing disconnects/reconnects
  });
}


function deleteRoom(roomId) {
  rooms.delete(roomId);
}


function addPlayer(roomId, username) {
  const room = rooms.get(roomId);
  if (room && !room.players.includes(username)) {
    room.players.push(username)
  }
}


function removePlayer(roomId, username) {
  const room = rooms.get(roomId);
  if(room) {

    room.players = room.players.filter(p => p !== username);

    if(username === room.host || room.players.length === 0) {
      
      // close room if the host leaves or there's no one in the room 
      // the room should always have atleast 1 anyways if there's a host
      deleteRoom(roomId);
    }
  }
}


function getPlayers(roomId) {

  const room = rooms.get(roomId);
  return room ? room.players : [];
}

// get random prompt for current round
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


//Stores a vote by a player.
function addVote(roomId, voter, votedFor) {
  const room = rooms.get(roomId);
  if(room) {
    room.votes.set(voter, votedFor);
  }
}


// Resets the current game phase and data for a new round.
// right now EVERYTHING is stored locally. ideally, everything is stored
//  in postgres, and the latest round is cached
async function resetRound(roomId) {
  const room = rooms.get(roomId);
  if(room) {
    // Save history
    const history = await fetchHistoryFromCache(roomId) || [];

    // room.history.push({
    history.push({
      prompt: room.currentPrompt,
      drawings: getAllDrawings(roomId),
      votes: Object.fromEntries(room.votes),
    });

    // Cache the history
    await cacheHistory(roomId, history);

    // Reset for next round
    room.currentPrompt = null;
    room.drawings = new Map();
    room.votes = new Map();
    room.phase = 'lobby';
    room.votingFinished = false;
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


//gets previous rounds histroy
async function getHistory(roomId) {
  const history = await await fetchHistoryFromCache(roomId);
  return history || [];
}

function registerVote(roomId, voter, votedFor){
    const room = rooms.get(roomId);
    if (!room || room.phase !== 'voting') return false;

    if (!room.players.includes(votedFor)) return false;
    if (voter === votedFor) return false;

    if (room.votes.has(voter)) return false; 
    
    room.votes.set(voter, votedFor);
    return true;
}

function allVotesIn(roomId){
  const room = rooms.get(roomId);
  if(!room) return false;

  return room.votes.size === room.players.length;
}

function tallyVotes(roomId) {
  const room = rooms.get(roomId);
  if (!room) return {};

  const tally = {};
  

  for (const votedFor of room.votes.values()) {
    if (tally[votedFor]) {
      tally[votedFor] += 1;
    } else {
      tally[votedFor] = 1;
    }
  }

  return tally;
}

function setPrompts(roomId, promptString) {
  const room = rooms.get(roomId);
  if (!room) return false;

  const promptList = promptString
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  room.prompts = [...promptList];
  return true;
}
//gets all the prompts
function getPrompts(roomId) {
  const room = rooms.get(roomId);
  return room?.prompts || [];
}

function addStroke(roomId, username, stroke) {

  const room = rooms.get(roomId);
  if (!room) return;

  if (!room.drawings.has(username)) {
    room.drawings.set(username, []);
  }

  room.drawings.get(username).push(stroke);
}

function getAllDrawings(roomId) {

  const room = rooms.get(roomId);
  if (!room) return {};
  const result = {};

  for (const [user, strokes] of room.drawings.entries()) {
    result[user] = strokes;
  }


  return result;
}



export default {
  createRoom,
  deleteRoom,
  addPlayer,
  removePlayer,
  getPlayers,
  getPrompt,
  getRoom,
  addDrawing,
  addVote,
  resetRound,
  setPhase,
  getPhase,
  getHistory,
  registerVote,
  allVotesIn,
  tallyVotes,
  setPrompts,
  getPrompts,
  addStroke,
  getAllDrawings
};
