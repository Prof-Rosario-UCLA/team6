import express from 'express';
import gameState from '../../services/gameState.js';
const router = express.Router();

// POST /api/lobby/history/:roomId (@ frontend get from this route)
router.get('/history/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const room = gameState.getRoom(roomId);

  if (!room) {
    return res.status(400).json({ error: 'Room not found' });
  }

  // TODO: getHistory fucntion in gameState
  res.json({ history: room.history });
});

// POST /api/lobby/prompts (@ frontend post to this route)
router.post('/prompts', (req, res) => {

  try {

    const { roomId, prompts, username } = req.body;

    if (!roomId || typeof prompts !== 'string' || !username) {
      return res.status(400).json({ error: 'roomId, prompts (string), and username required' });
    }

    const room = gameState.getRoom(roomId);
    if (!room) {
      return res.status(400).json({ error: 'Room not found' });
    }

    if (room.host !== username) {
      return res.status(400).json({ error: 'Only the host can set prompts' });
    }

    const success = gameState.setPrompts(roomId, prompts);
    if (!success) {
      return res.status(500).json({ error: 'Failed to set prompts' });
    }

    console.log(`Prompts set for room ${roomId} by ${username}`);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error in POST /prompts:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;
