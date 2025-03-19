import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const connectedClients = new Set<WebSocket>();

// WebSocket bağlantılarını yönet
wss.on("connection", (ws) => {
    console.log("🔗 Yeni cihaz bağlandı!");
    connectedClients.add(ws);

    ws.on("message", (message) => {
        console.log(`📩 Mesaj alındı: ${message}`);

        // Mesajı tüm bağlı istemcilere ilet
        connectedClients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on("close", () => {
        console.log("🔴 Cihaz bağlantısı kesildi!");
        connectedClients.delete(ws);
    });

    ws.on("error", (error) => {
        console.error("⚠️ WebSocket hatası:", error);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 WebSocket Sunucusu ${PORT} portunda çalışıyor...`);
});
