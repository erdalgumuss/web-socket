import WebSocket, { WebSocketServer } from "ws";
import os from "os";

const PORT = process.env.PORT || 3000;
const MAX_AUDIO_SIZE = 65536; // Maksimum 64 KB parça (chunk) boyutu
// İstediğiniz MIME türünü ortam değişkeni ile ayarlayabilirsiniz.
// Örneğin: AUDIO_MIME_TYPE=audio/ogg node server.js
const MIME_TYPE = process.env.AUDIO_MIME_TYPE || "audio/webm";
const wss = new WebSocketServer({ port: Number(PORT) });

console.log(`✅ WebSocket sunucusu ${PORT} portunda çalışıyor...`);

const clients: Set<WebSocket> = new Set();

wss.on("connection", (ws: WebSocket) => {
    clients.add(ws);
    console.log(`🚀 Yeni istemci bağlandı! (Toplam: ${clients.size})`);

    ws.on("message", (data: Buffer) => {
        console.log(`🎤 Gelen ses verisi. Boyut: ${data.length} byte`);

        if (data.length > MAX_AUDIO_SIZE) {
            console.warn(`⚠️ AŞIRI BÜYÜK SES VERİSİ ENGELLENDİ: ${data.length} byte`);
            return;
        }

        // Gelen Buffer'ı MIME türüne uygun Base64 formatına çeviriyoruz
        const base64Audio = `data:${MIME_TYPE};base64,${data.toString("base64")}`;

        // Diğer istemcilere gönder
        broadcastAudio(base64Audio, ws);
    });

    ws.on("close", () => {
        clients.delete(ws);
        console.log(`❌ Bağlantı kapandı. (Kalan istemciler: ${clients.size})`);
    });

    ws.on("error", (err: Error) => {
        console.error(`⚠️ Hata oluştu: ${err.message}`);
    });
});

function broadcastAudio(audioData: string, sender: WebSocket): void {
    for (const client of clients) {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(audioData);
        }
    }
}

function getServerIP(): string {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const addr of iface || []) {
            if (addr.family === "IPv4" && !addr.internal) {
                return addr.address;
            }
        }
    }
    return "localhost";
}

console.log(`🌐 WebSocket erişim noktası: ws://${getServerIP()}:${PORT}`);
