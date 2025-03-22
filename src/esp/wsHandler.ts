import { WebSocket } from 'ws';
import { Agent } from '@/core/agent';
import { OutputSender } from './outputSender';
import { InputProcessor } from './inputProcessor';

export class ESPWebSocketHandler {
  private outputSender: OutputSender;
  private agent: Agent;

  constructor(outputSender: OutputSender, agent: Agent) {
    this.outputSender = outputSender;
    this.agent = agent;
  }

  handleConnection(ws: WebSocket) {
    console.log('[ESP] Bağlantı alındı.');
    this.outputSender.addClient(ws);

    const inputProcessor = new InputProcessor(async (audioBuffer) => {
      console.log('[PROCESSOR] Ses işlendi, ESP’ye gönderilecek.');

      const response = await this.agent.handleIncomingAudio(audioBuffer);
      this.outputSender.broadcastAudio(response);
    });

    ws.on('message', (data) => {
      if (data instanceof Buffer || data instanceof Uint8Array) {
        inputProcessor.handleIncomingChunk(data);
      }
    });

    ws.on('close', () => {
      console.log('[ESP] Bağlantı kapatıldı.');
      this.outputSender.removeClient(ws);
      inputProcessor.cleanup();
    });
  }
}
