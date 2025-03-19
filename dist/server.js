"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const ws_1 = require("ws");
const node_server_1 = require("@hono/node-server");
const hono_1 = require("hono");
const node_ws_1 = require("@hono/node-ws");
const serve_static_1 = require("@hono/node-server/serve-static");
const prompt_1 = require("./prompt");
const tools_1 = require("./tools");
const agent_1 = require("./lib/agent");
const app = new hono_1.Hono();
const WS_PORT = 3000;
const connectedClients = new Set();
const { injectWebSocket, upgradeWebSocket } = (0, node_ws_1.createNodeWebSocket)({ app });
app.use("/", (0, serve_static_1.serveStatic)({ path: "./static/index.html" }));
app.use("/static/*", (0, serve_static_1.serveStatic)({ root: "./" }));
app.get("/device", upgradeWebSocket((c) => ({
    onOpen: (c, ws) => __awaiter(void 0, void 0, void 0, function* () {
        if (!process.env.OPENAI_API_KEY) {
            return ws.close();
        }
        const rawWs = ws.raw;
        connectedClients.add(rawWs);
        const broadcastToClients = (data) => {
            connectedClients.forEach(client => {
                if (client.readyState === ws_1.WebSocket.OPEN) {
                    // console.log('Broadcasting to client:', data);
                    // Convert base64 to buffer if data is a base64 string
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.type === "response.audio.delta" && parsed.delta) {
                            const audioBuffer = Buffer.from(parsed.delta, 'base64');
                            // Send audio data in chunks that ESP32 can handle
                            const CHUNK_SIZE = 1024; // ESP32 friendly chunk size
                            for (let i = 0; i < audioBuffer.length; i += CHUNK_SIZE) {
                                const chunk = audioBuffer.slice(i, i + CHUNK_SIZE);
                                client.send(chunk);
                            }
                            return;
                        }
                    }
                    catch (e) {
                        // If parsing fails, send original data
                    }
                    // client.send(data);
                    // client.send(data);
                }
            });
        };
        const agent = new agent_1.OpenAIVoiceReactAgent({
            instructions: prompt_1.INSTRUCTIONS,
            tools: tools_1.TOOLS,
            model: "gpt-4o-realtime-preview",
            audioConfig: {
                sampleRate: 24000, // Match ESP32 sample rate
                channels: 1,
                bitDepth: 16
            }
        });
        // Wait 100ms before connecting to allow WebSocket setup
        yield new Promise(resolve => setTimeout(resolve, 1000));
        yield agent.connect(rawWs, broadcastToClients);
    }),
    onClose: (c, ws) => {
        const rawWs = ws.raw;
        connectedClients.delete(rawWs);
        console.log("Client disconnected");
    },
})));
const server = (0, node_server_1.serve)({
    fetch: app.fetch,
    port: WS_PORT,
});
injectWebSocket(server);
console.log(`Server is running on port ${WS_PORT}`);
