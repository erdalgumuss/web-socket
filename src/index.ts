import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { env } from './config/env';
import { Agent } from './core/agent';
import { OutputSender } from './esp/outputSender';
import { ESPWebSocketHandler } from './esp/wsHandler';

const server = createServer();
const wss = new WebSocketServer({ server });

const agent = new Agent();
const outputSender = new OutputSender();
const espHandler = new ESPWebSocketHandler(outputSender, agent);

wss.on('connection', (ws) => {
  espHandler.handleConnection(ws);
});

server.listen(env.PORT, () => {
  console.log(`✅ ESP WebSocket sunucusu başlatıldı → ws://localhost:${env.PORT}`);
});
