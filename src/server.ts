import WebSocket, { WebSocketServer } from "ws";
import os from "os";

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: Number(PORT) });

console.log(`✅ WebSocket sunucusu ${PORT} portunda çalışıyor...`);

const clients = new Map<WebSocket, string>(); // Map ile istemcileri IP'ye bağlıyoruz.

wss.on("connection", (ws: WebSocket, req) => {
    const clientIP = req.socket.remoteAddress?.replace(/^.*:/, '') || "Bilinmeyen IP";

    clients.set(ws, clientIP);
    console.log(`🚀 Yeni istemci bağlandı! IP: ${clientIP} (Toplam: ${clients.size})`);

    ws.on("message", (message: WebSocket.Data) => {
        const msgStr = message.toString(); // Binary olabilme ihtimaline karşı string çeviriyoruz.

        if (typeof msgStr !== "string" || msgStr.length > 1000) {
            console.warn(`⚠️ Geçersiz veya uzun mesaj engellendi! IP: ${clientIP}`);
            return;
        }

        console.log(`📩 Mesaj alındı (${clientIP}): ${msgStr}`);
        broadcast(`📢 Yeni mesaj: ${msgStr}`, ws);
    });

    ws.on("close", () => {
        clients.delete(ws);
        console.log(`❌ Bağlantı kapandı. (Kalan: ${clients.size})`);
    });

    ws.on("error", (err: Error) => {
        console.error(`⚠️ Hata oluştu: ${err.message}`);
    });
});

// Tüm istemcilere mesaj gönderen yardımcı fonksiyon
const broadcast = (message: string, sender: WebSocket) => {
    for (const [client, ip] of clients) {
        if (client.readyState === WebSocket.OPEN && client !== sender) {
            client.send(message);
        }
    }
};

// Sunucu IP adresini belirleme fonksiyonu
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
