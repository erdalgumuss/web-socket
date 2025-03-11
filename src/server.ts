import WebSocket, { WebSocketServer } from 'ws';

// WebSocket Sunucusunu 8080 portunda başlat
const wss = new WebSocketServer({ host: "0.0.0.0", port: 8080 });

console.log("✅ WebSocket sunucusu 8080 portunda çalışıyor...");

wss.on("connection", (ws) => {
    console.log("🚀 ESP32 bağlandı!");

    ws.on("message", (message) => {
        console.log(`📩 ESP32'den gelen mesaj: ${message}`);
        
        // ESP32'ye mesajı geri gönder
        ws.send(`✅ Mesajını aldım: ${message}`);
    });

    ws.on("close", () => {
        console.log("❌ ESP32 bağlantıyı kapattı.");
    });
});
