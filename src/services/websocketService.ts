import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

export type WebSocketMessageHandler = (ws: WebSocket, data: Buffer) => void;
export type WebSocketCloseHandler = (ws: WebSocket) => void;

export class WebSocketService {
  private wss: WebSocketServer;

  constructor(server: any) {
    this.wss = new WebSocketServer({ server });
  }

  onConnection(handler: (ws: WebSocket, req: IncomingMessage) => void) {
    this.wss.on('connection', handler);
  }
}
