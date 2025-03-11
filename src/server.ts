import WebSocket, { WebSocketServer } from "ws";
import os from "os";

const PORT = process.env.PORT || 3000;
const MAX_AUDIO_SIZE = 65536; // Maksimum 64 KB parça (chunk) boyutu
const wss = new WebSocketServer({ port: Number(PORT) });

console.log(`✅ WebSocket sunucusu ${PORT} portunda çalışıyor...`);

// Bağlı istemcilerin tutulduğu set
const clients: Set<WebSocket> = new Set();

wss.on("connection", (ws: WebSocket) => {
    clients.add(ws);
    console.log(`🚀 Yeni istemci bağlandı! (Toplam: ${clients.size})`);

    ws.on("message", (data: Buffer) => {
        // Gelen veri Buffer tipinde
        console.log(`🎤 Gelen ses verisi. Boyut: ${data.length} byte`);

        // Ses verisi çok büyükse engelle
        if (data.length > MAX_AUDIO_SIZE) {
            console.warn(`⚠️ AŞIRI BÜYÜK SES VERİSİ ENGELLENDİ: ${data.length} byte`);
            return;
        }

        // WebM formatındaki Buffer'ı Base64'e çevir
        const base64Audio = `data:audio/webm;base64,${data.toString("base64")}`;

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
        // Aynı gönderen istemciye geri yollamamak için filtre
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(audioData);
        }
    }
}

// İsteğe bağlı: Sunucu IP adresini konsolda göstermek
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