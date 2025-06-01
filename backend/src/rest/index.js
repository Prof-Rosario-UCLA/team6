import express from 'express';
import lobbyRoutes from './routes/lobby.js';
import drawingRoutes from './routes/drawing.js';
import votingRoutes from './routes/voting.js';
import resultsRoutes from './routes/results.js';

const router = express.Router();

router.use('/lobby', lobbyRoutes);
router.use('/drawing', drawingRoutes);
router.use('/voting', votingRoutes);
router.use('/results', resultsRoutes);

export default router;
