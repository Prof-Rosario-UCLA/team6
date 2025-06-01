import express from 'express';
const router = express.Router();

// POST /api/lobby/create
router.post('/create', (req, res) => {
  const { hostName } = req.body;
  // TODO: what do we wanna do witht this?
  res.json({ message: `Lobby created by ${hostName}` });
});

// GET /api/lobby/:roomId
router.get('/:roomId', (req, res) => {
  const { roomId } = req.params;
  // TODO: fetch lobby info from postgres 
  res.json({ roomId, players: [] });
});

export default router;
