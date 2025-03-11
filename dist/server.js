"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importStar(require("ws"));
const os_1 = __importDefault(require("os"));
const PORT = process.env.PORT || 3000;
const wss = new ws_1.WebSocketServer({ port: Number(PORT) });
console.log(`✅ WebSocket sunucusu ${PORT} portunda çalışıyor...`);
const clients = new Map(); // Map ile istemcileri IP'ye bağlıyoruz.
wss.on("connection", (ws, req) => {
    var _a;
    const clientIP = ((_a = req.socket.remoteAddress) === null || _a === void 0 ? void 0 : _a.replace(/^.*:/, '')) || "Bilinmeyen IP";
    clients.set(ws, clientIP);
    console.log(`🚀 Yeni istemci bağlandı! IP: ${clientIP} (Toplam: ${clients.size})`);
    ws.on("message", (message) => {
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
    ws.on("error", (err) => {
        console.error(`⚠️ Hata oluştu: ${err.message}`);
    });
});
// Tüm istemcilere mesaj gönderen yardımcı fonksiyon
const broadcast = (message, sender) => {
    for (const [client, ip] of clients) {
        if (client.readyState === ws_1.default.OPEN && client !== sender) {
            client.send(message);
        }
    }
};
// Sunucu IP adresini belirleme fonksiyonu
const getServerIP = () => {
    const interfaces = os_1.default.networkInterfaces();
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
