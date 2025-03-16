import WebSocket, { WebSocketServer } from "ws";
import os from "os";

const PORT = process.env.PORT || 3000;
const MAX_AUDIO_SIZE = 65536; // Maksimum 64 KB ses parçası (chunk)

const wss = new WebSocketServer({ port: Number(PORT) });

console.log(`✅ WebSocket sunucusu ${PORT} portunda çalışıyor...`);

// 📌 İstemci yönetimi
interface Client {
    socket: WebSocket;
    id: string;
    state: "Idle" | "Listening" | "Speaking";
    lastPing: number;
}

const clients: Set<Client> = new Set();

wss.on("connection", (ws: WebSocket) => {
    const client: Client = {
        socket: ws,
        id: generateClientID(),
        state: "Idle",
        lastPing: Date.now(),
    };

    clients.add(client);
    console.log(`🚀 Yeni istemci bağlandı! (Toplam: ${clients.size})`);

    // 📌 İlk bağlantıda istemciye zaman damgası gönder
    ws.send(getTimestamp().toString());

    ws.on("message", (data: Buffer) => handleMessage(client, data));

    ws.on("close", () => {
        clients.delete(client);
        console.log(`❌ Bağlantı kapandı. (Kalan istemciler: ${clients.size})`);
    });

    ws.on("error", (err: Error) => {
        console.error(`⚠️ Hata oluştu: ${err.message}`);
    });
});

// 📌 Gelen mesajları işleme
function handleMessage(client: Client, data: Buffer) {
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
        } else {
            client.state = "Idle";
        }
        broadcastToClients(client, data);
    } else {
        // 📌 Ses verisi yönlendirme
        broadcastToClients(client, data);
    }
}

// 📌 Tüm istemcilere veriyi gönder
function broadcastToClients(sender: Client, data: Buffer) {
    for (const client of clients) {
        if (client !== sender && client.socket.readyState === WebSocket.OPEN) {
            if (data.length > 1) {
                client.socket.send(data);
            } else {
                client.state = client.state === "Idle" ? "Listening" : "Idle";
                client.socket.send(getTimestamp().toString());
            }
        }
    }
}

// 📌 Tüm istemciler "Idle" mı kontrol et
function allClientsIdle(): boolean {
    return [...clients].every(client => client.state === "Idle");
}

// 📌 Zaman damgası oluştur
function getTimestamp(): number {
    return parseInt(Date.now().toString().slice(-8));
}

// 📌 Benzersiz istemci ID oluştur
function generateClientID(): string {
    return `client-${Math.random().toString(36).substr(2, 9)}`;
}

// 📌 Gelen verinin metin mesajı olup olmadığını kontrol et
function isTextMessage(data: Buffer): boolean {
    // Basit bir kontrol: Eğer veri bir JSON string ise metin mesajıdır
    try {
        JSON.parse(data.toString());
        return true;
    } catch {
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
