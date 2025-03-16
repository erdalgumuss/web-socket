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
const MAX_AUDIO_SIZE = 65536; // Maksimum 64 KB ses parçası (chunk)
const wss = new ws_1.WebSocketServer({ port: Number(PORT) });
console.log(`✅ WebSocket sunucusu ${PORT} portunda çalışıyor...`);
const clients = new Set();
wss.on("connection", (ws) => {
    const client = {
        socket: ws,
        id: generateClientID(),
        state: "Idle",
        lastPing: Date.now(),
    };
    clients.add(client);
    console.log(`🚀 Yeni istemci bağlandı! (Toplam: ${clients.size})`);
    // 📌 İlk bağlantıda istemciye zaman damgası gönder
    ws.send(getTimestamp().toString());
    ws.on("message", (data) => handleMessage(client, data));
    ws.on("close", () => {
        clients.delete(client);
        console.log(`❌ Bağlantı kapandı. (Kalan istemciler: ${clients.size})`);
    });
    ws.on("error", (err) => {
        console.error(`⚠️ Hata oluştu: ${err.message}`);
    });
});
// 📌 Gelen mesajları işleme
function handleMessage(client, data) {
    client.lastPing = Date.now();
    if (data.length === 1) {
        console.log(`📡 Ping alındı - İstemci ID: ${client.id}`);
        return;
    }
    if (data.length > MAX_AUDIO_SIZE) {
        console.warn(`⚠️ Büyük ses verisi engellendi (${data.length} byte)`);
        return;
    }
    if (isTextMessage(data)) {
        // 📌 Konuşma durumu güncellemesi
        if (allClientsIdle()) {
            client.state = "Speaking";
            client.socket.send(getTimestamp().toString());
        }
        else {
            client.state = "Idle";
        }
        broadcastToClients(client, data);
    }
    else {
        // 📌 Ses verisi yönlendirme
        broadcastToClients(client, data);
    }
}
// 📌 Tüm istemcilere veriyi gönder
function broadcastToClients(sender, data) {
    for (const client of clients) {
        if (client !== sender && client.socket.readyState === ws_1.default.OPEN) {
            if (data.length > 1) {
                client.socket.send(data);
            }
            else {
                client.state = client.state === "Idle" ? "Listening" : "Idle";
                client.socket.send(getTimestamp().toString());
            }
        }
    }
}
// 📌 Tüm istemciler "Idle" mı kontrol et
function allClientsIdle() {
    return [...clients].every(client => client.state === "Idle");
}
// 📌 Zaman damgası oluştur
function getTimestamp() {
    return parseInt(Date.now().toString().slice(-8));
}
// 📌 Benzersiz istemci ID oluştur
function generateClientID() {
    return `client-${Math.random().toString(36).substr(2, 9)}`;
}
// 📌 Gelen verinin metin mesajı olup olmadığını kontrol et
function isTextMessage(data) {
    // Basit bir kontrol: Eğer veri bir JSON string ise metin mesajıdır
    try {
        JSON.parse(data.toString());
        return true;
    }
    catch (_a) {
        return false;
    }
}
// 📌 Bağlantı kontrolü & zaman aşımı temizleme
setInterval(() => {
    console.log(`🔍 Bağlı istemci sayısı: ${clients.size}`);
    const now = Date.now();
    for (const client of clients) {
        if (now - client.lastPing > 10000) {
            console.log(`⏳ Zaman aşımına uğrayan istemci: ${client.id}`);
            client.socket.close();
            clients.delete(client);
        }
    }
}, 5000);
// 📌 Sunucu IP adresini alma
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
