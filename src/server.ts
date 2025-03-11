import WebSocket, { WebSocketServer } from "ws";
import os from "os";

// Fly.io, PORT'u otomatik olarak atar, default olarak 3000 kullanacağız
const PORT = process.env.PORT || 3000;

// WebSocket Sunucusunu başlat
const wss = new WebSocketServer({ port: Number(PORT) });

console.log(`✅ WebSocket sunucusu ${PORT} portunda çalışıyor...`);

// Bağlı istemcileri takip etmek için sayaç
let clientCount = 0;

wss.on("connection", (ws, req) => {
    clientCount++;
    const clientIP = req.socket.remoteAddress || "Bilinmeyen IP";
    console.log(`🚀 Yeni istemci bağlandı! IP: ${clientIP} (Toplam: ${clientCount})`);

    ws.on("message", (message) => {
        console.log(`📩 Mesaj alındı (${clientIP}): ${message}`);
        ws.send(`✅ Mesajını aldım: ${message}`);
    });

    ws.on("close", () => {
        clientCount--;
        console.log(`❌ Bağlantı kapandı. (Kalan: ${clientCount})`);
    });

    ws.on("error", (err) => {
        console.error(`⚠️ Hata oluştu: ${err.message}`);
    });
});

// Sunucunun IP adresini bulmak için
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
