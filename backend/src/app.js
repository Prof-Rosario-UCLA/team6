import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import registerSocketHandlers from './sockets/index.js';
import apiRoutes from './rest/index.js';


const PORT = 1919;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

registerSocketHandlers(io);


server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
