import WebSocket, { WebSocketServer } from "ws";
import os from "os";

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: Number(PORT) });

console.log(`✅ WebSocket sunucusu ${PORT} portunda çalışıyor...`);

const clients = new Map(); // Map kullanarak istemcileri IP ile eşleştiriyoruz.

wss.on("connection", (ws, req) => {
    const clientIP = req.socket.remoteAddress?.replace(/^.*:/, '') || "Bilinmeyen IP";
    
    clients.set(ws, clientIP);
    console.log(`🚀 Yeni istemci bağlandı! IP: ${clientIP} (Toplam: ${clients.size})`);

    ws.on("message", (message) => {
        if (typeof message !== "string" || message.length > 1000) {
            console.warn(`⚠️ Geçersiz veya uzun mesaj engellendi! IP: ${clientIP}`);
            return;
        }
        
        console.log(`📩 Mesaj alındı (${clientIP}): ${message}`);
        broadcast(`📢 Yeni mesaj: ${message}`, ws);
    });

    ws.on("close", () => {
        clients.delete(ws);
        console.log(`❌ Bağlantı kapandı. (Kalan: ${clients.size})`);
    });

    ws.on("error", (err) => {
        console.error(`⚠️ Hata oluştu: ${err.message}`);
    });
});

// Tüm istemcilere mesaj gönderen yardımcı fonksiyon
const broadcast = (message, sender) => {
    for (const [client, ip] of clients) {
        if (client.readyState === WebSocket.OPEN && client !== sender) {
            client.send(message);
        }
    }
};

// Sunucu IP adresini belirleme fonksiyonu
const getServerIP = () => {
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
