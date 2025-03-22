import { WebSocket } from 'ws';

const CHUNK_SIZE = 1024; // ESP32'nin kaldırabileceği maksimum boyut

export class OutputSender {
  private clients = new Set<WebSocket>();

  /**
   * Yeni bir ESP cihazı bağlandığında ekle
   */
  public addClient(ws: WebSocket) {
    this.clients.add(ws);
  }

  /**
   * Cihaz bağlantısı kesildiğinde çıkar
   */
  public removeClient(ws: WebSocket) {
    this.clients.delete(ws);
  }

  /**
   * Sesli yanıtı (buffer olarak) tüm bağlı cihazlara parça parça gönder
   */
  public broadcastAudio(buffer: Buffer) {
    for (const client of this.clients) {
      if (client.readyState !== WebSocket.OPEN) continue;

      for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
        const chunk = buffer.slice(i, i + CHUNK_SIZE);
        client.send(chunk);
      }
    }
  }

  /**
   * JSON ya da kontrol mesajları göndermek istersen
   */
  public broadcastJSON(data: any) {
    const message = JSON.stringify(data);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}
