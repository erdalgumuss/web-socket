import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { env } from '@/config/env';
import { Agent } from '@/core/agent';
import { InputProcessor } from '@/esp/inputProcessor';
import { OutputSender } from '@/esp/outputSender';

const agent = new Agent();
const outputSender = new OutputSender();

// HTTP + WebSocket sunucusu başlat
const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  console.log('[ESP] Yeni bağlantı:', req.socket.remoteAddress);
  outputSender.addClient(ws);

  const inputProcessor = new InputProcessor(async (buffer) => {
    console.log('[PROCESSOR] Buffer işlemeye gönderildi');

    // Agent üzerinden sesi işleyip cevabı al
    const responseBuffer = await agent.handleIncomingAudio(buffer);

    // Yanıt sesini ESP’ye gönder
    outputSender.broadcastAudio(responseBuffer);
  });

  ws.on('message', (data) => {
    if (data instanceof Buffer || data instanceof Uint8Array) {
      inputProcessor.handleIncomingChunk(data);
    }
  });

  ws.on('close', () => {
    console.log('[ESP] Bağlantı kapandı.');
    outputSender.removeClient(ws);
    inputProcessor.cleanup();
  });
});

// Sunucuyu başlat
server.listen(env.PORT, () => {
  console.log(`✅ Sunucu başlatıldı → ws://localhost:${env.PORT}/device`);
});
