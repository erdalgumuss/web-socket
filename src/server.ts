import WebSocket, { WebSocketServer } from "ws";
import os from "os";

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: Number(PORT) });

console.log(`✅ WebSocket sunucusu ${PORT} portunda çalışıyor...`);

const clients = new Set<WebSocket>(); // Bağlı istemciler

wss.on("connection", (ws: WebSocket, req) => {
    clients.add(ws);
    console.log(`🚀 Yeni istemci bağlandı! (Toplam: ${clients.size})`);

    ws.on("message", (data: Buffer) => {
        console.log(`🎤 Ses verisi alındı. Boyut: ${data.length} byte`);
        broadcastAudio(data, ws);
    });

    ws.on("close", () => {
        clients.delete(ws);
        console.log(`❌ Bağlantı kapandı. (Kalan istemciler: ${clients.size})`);
    });

    ws.on("error", (err: Error) => {
        console.error(`⚠️ Hata oluştu: ${err.message}`);
    });
});

// 📌 Gelen ses verisini diğer istemcilere ileten fonksiyon
const broadcastAudio = (audioData: Buffer, sender: WebSocket) => {
    for (const client of clients) {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(audioData);
        }
    }
};

// 📌 Sunucu IP adresini belirleme fonksiyonu
const getServerIP = (): string => {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const addr of iface || []) {
            if (addr.family === "IPv4" && !addr.internal) {
                return addr.address;
            }
        }
    }
    return "localhost";
};

console.log(`🌐 WebSocket erişim noktası: ws://${getServerIP()}:${PORT}`);
