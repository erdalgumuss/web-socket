import WebSocket, { WebSocketServer } from "ws";
import os from "os";
import fs from "fs";

const PORT = process.env.PORT || 3000;
const wss = new WebSocketServer({ port: Number(PORT) });

console.log(`✅ WebSocket sunucusu ${PORT} portunda çalışıyor...`);

const clients = new Map<WebSocket, string>(); // Bağlı istemciler

wss.on("connection", (ws: WebSocket, req) => {
    const clientIP = req.socket.remoteAddress?.replace(/^.*:/, '') || "Bilinmeyen IP";
    clients.set(ws, clientIP);

    console.log(`🚀 Yeni istemci bağlandı! IP: ${clientIP} (Toplam: ${clients.size})`);

    ws.on("message", (message: WebSocket.Data) => {
        if (Buffer.isBuffer(message)) {
            handleBinaryMessage(ws, message, clientIP);
        } else {
            handleTextMessage(ws, message.toString(), clientIP);
        }
    });

    ws.on("close", () => {
        clients.delete(ws);
        console.log(`❌ Bağlantı kapandı. (Kalan istemciler: ${clients.size})`);
    });

    ws.on("error", (err: Error) => {
        console.error(`⚠️ Hata oluştu: ${err.message}`);
    });
});

// 📌 Gelen metin mesajlarını işleyip dağıtan fonksiyon
const handleTextMessage = (ws: WebSocket, message: string, clientIP: string) => {
    try {
        const jsonMessage = JSON.parse(message);
        if (!jsonMessage.type || !jsonMessage.data) {
            console.warn(`⚠️ Geçersiz JSON formatı! IP: ${clientIP}`);
            return;
        }

        console.log(`📩 Metin mesajı alındı (${clientIP}): ${jsonMessage.data}`);

        // Eğer mesaj "text" türündeyse, herkese gönder
        if (jsonMessage.type === "text") {
            broadcast({
                type: "text",
                data: `📢 ${clientIP}: ${jsonMessage.data}`
            }, ws);
        }

    } catch (error) {
        console.warn(`⚠️ JSON ayrıştırma hatası! IP: ${clientIP}, Hata: ${error}`);
    }
};

// 📌 Ses verisini işleyen fonksiyon
const handleBinaryMessage = (ws: WebSocket, data: Buffer, clientIP: string) => {
    console.log(`🎤 Ses verisi alındı (${clientIP}), Boyut: ${data.length} byte`);

    // Dosyaya kaydet (PCM formatında)
    const filename = `received_audio_${Date.now()}.pcm`;
    fs.writeFileSync(filename, data);
    console.log(`💾 Ses verisi kaydedildi: ${filename}`);

    // Ses verisini istemciye geri gönder
    ws.send(JSON.stringify({ type: "audio_ack", data: "Ses alındı!" }));
};

// 📌 Tüm istemcilere mesaj gönderen yardımcı fonksiyon
const broadcast = (message: object, sender: WebSocket) => {
    const messageString = JSON.stringify(message);
    for (const [client] of clients) {
        if (client.readyState === WebSocket.OPEN && client !== sender) {
            client.send(messageString);
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
