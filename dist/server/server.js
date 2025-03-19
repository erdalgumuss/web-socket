"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const PORT = 3000;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
const connectedClients = new Set();
// WebSocket bağlantılarını yönet
wss.on("connection", (ws) => {
    console.log("🔗 Yeni cihaz bağlandı!");
    connectedClients.add(ws);
    ws.on("message", (message) => {
        console.log(`📩 Mesaj alındı: ${message}`);
        // Mesajı tüm bağlı istemcilere ilet
        connectedClients.forEach((client) => {
            if (client !== ws && client.readyState === ws_1.WebSocket.OPEN) {
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
