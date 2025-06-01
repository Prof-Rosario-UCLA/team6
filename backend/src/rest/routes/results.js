import express from 'express';
const router = express.Router();

// GET /api/results/:roomId
router.get('/:roomId', (req, res) => {
  const { roomId } = req.params;
  // TODO: results logic
  res.json({ roomId, winners: [] });
});

export default router;
