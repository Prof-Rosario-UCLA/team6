import express from 'express';
const router = express.Router();

// POST /api/drawing/save
// this is NOT the one for live strokes, that's still TODO
router.post('/save', (req, res) => {
  const { roomId, strokes } = req.body;
  // TODO: save strokes to postgres
  res.json({ message: 'Drawing saved.' });
});

export default router;
