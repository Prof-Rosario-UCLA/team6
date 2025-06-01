import express from 'express';
const router = express.Router();

// POST /api/voting/submit
router.post('/submit', (req, res) => {
  const { roomId, vote } = req.body;
  // TODO: voting logic
  res.json({ message: 'Vote submitted.' });
});

export default router;
