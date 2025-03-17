import { WebSocketServer, WebSocket } from 'ws';

const PORT = Number(process.env.PORT) || 3000;

const wss = new WebSocketServer({ port: PORT });

console.log(`✅ WebSocket server started on port ${PORT}`);

wss.on('connection', (ws: WebSocket) => {
    console.log('🚀 Yeni istemci bağlandı!');

    // ESP32 ilk bağlantıda "Hello Server" mesajını gönderiyor
    ws.on('message', (data: Buffer) => {
        if (typeof data === 'string') {
            console.log(`📩 Metin mesajı alındı: ${data}`);
        } else {
            console.log(`🎤 Binary mesaj alındı (${data.length} byte)`);

            // Binary mesajı diğer istemcilere yönlendir
            broadcastBinary(data, ws);
        }
    });

    ws.on('close', () => {
        console.log('❌ İstemci bağlantısı kapandı.');
    });

    ws.on('error', (err) => {
        console.error(`⚠️ WebSocket Hatası: ${err.message}`);
    });

    // ESP32 tarafından gönderilen ping'lere cevap verir.
    ws.on('ping', () => {
        console.log('📡 Ping alındı.');
        ws.pong();
    });

    // Sunucu tarafından ESP32'ye periyodik ping gönderilir
    const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.ping();
        } else {
            clearInterval(interval);
        }
    }, 10000); // 10 saniyede bir ping
});

// Binary mesajı diğer istemcilere gönder
function broadcastBinary(data: Buffer, sender: WebSocket): void {
    wss.clients.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}
