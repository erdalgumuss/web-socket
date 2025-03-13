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
const MAX_AUDIO_SIZE = 65536; // Maksimum 64 KB ses paketi boyutu
const wss = new ws_1.WebSocketServer({ port: Number(PORT) });
console.log(`✅ WebSocket sunucusu ${PORT} portunda çalışıyor...`);
const clients = new Set();
wss.on("connection", (ws) => {
    clients.add(ws);
    console.log(`🚀 Yeni istemci bağlandı! (Toplam: ${clients.size})`);
    ws.on("message", (data) => {
        console.log(`🎤 Gelen ses verisi. Boyut: ${data.length} byte`);
        if (data.length > MAX_AUDIO_SIZE) {
            console.warn(`⚠️ AŞIRI BÜYÜK SES VERİSİ ENGELLENDİ: ${data.length} byte`);
            return;
        }
        // 🔥 PCM verisini Base64'e çevirmek yerine doğrudan gönderiyoruz
        broadcastAudio(data, ws);
    });
    ws.on("close", () => {
        clients.delete(ws);
        console.log(`❌ Bağlantı kapandı. (Kalan istemciler: ${clients.size})`);
    });
    ws.on("error", (err) => {
        console.error(`⚠️ Hata oluştu: ${err.message}`);
    });
});
// 📌 Gelen ses verisini diğer istemcilere ilet
function broadcastAudio(audioData, sender) {
    for (const client of clients) {
        if (client !== sender && client.readyState === ws_1.default.OPEN) {
            client.send(audioData);
        }
    }
}
// 📌 Sunucu IP adresini al
function getServerIP() {
    const interfaces = os_1.default.networkInterfaces();
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
