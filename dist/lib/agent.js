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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIVoiceReactAgent = void 0;
const zod_to_json_schema_1 = __importDefault(require("zod-to-json-schema"));
const audio_1 = require("./audio");
const utils_1 = require("./utils");
const ws_1 = __importDefault(require("ws"));
const connections_1 = require("./connections");
const executor_1 = require("./executor");
// Constants
const EVENTS_TO_IGNORE = [
    "response.function_call_arguments.delta",
    "rate_limits.updated",
    "response.audio_transcript.delta",
    "response.created",
    "response.content_part.added",
    "response.content_part.done",
    "conversation.item.created",
    "response.audio.done",
    "session.created",
    "session.updated",
    "response.done",
    "response.output_item.done",
];
class OpenAIVoiceReactAgent {
    constructor(params) {
        var _a;
        this.BUFFER_SIZE = 4800;
        // Public properties
        this.buffer = new Uint8Array();
        this.recording = false;
        this.audioManager = new audio_1.AudioManager();
        this.connection = new connections_1.OpenAIWebSocketConnection({
            url: params.url,
            apiKey: params.apiKey,
            model: params.model,
            audioConfig: params.audioConfig,
            audioManager: this.audioManager
        });
        this.instructions = params.instructions;
        this.tools = (_a = params.tools) !== null && _a !== void 0 ? _a : [];
    }
    startRecordingSession() {
        // Make sure we're not already recording
        if (this.recording) {
            this.audioManager.resetRecording();
        }
        this.recording = true;
        this.audioManager.startRecording();
        console.log('Started new recording session');
    }
    stopRecordingAndProcessAudio() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.recording) {
                console.log('No active recording to stop');
                return;
            }
            // Set recording flag first to prevent new data
            this.recording = false;
            try {
                // Make sure to process any remaining audio
                this.audioManager.closeFile();
                // Get the buffer after closing to ensure all data is written
                const buffer = this.audioManager.getCurrentBuffer();
                if (buffer.length === 0) {
                    console.log('No audio data captured');
                    return;
                }
                const base64 = (0, utils_1.convertAudioToPCM16)(buffer);
                yield this.sendAudioEvent(base64);
            }
            catch (error) {
                console.error('Error processing audio:', error);
            }
            finally {
                // Always reset the audio manager
                this.audioManager.resetRecording();
                console.log('Recording session ended and cleaned up');
            }
        });
    }
    sendAudioEvent(base64Audio) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!base64Audio) {
                console.log('No audio data to send');
                return;
            }
            const eventAudio = {
                type: 'conversation.item.create',
                item: {
                    type: 'message',
                    role: 'user',
                    content: [{
                            type: 'input_audio',
                            audio: base64Audio
                        }]
                }
            };
            try {
                this.connection.sendEvent(eventAudio);
                // Wait for the audio event to be processed
                yield new Promise(resolve => setTimeout(resolve, 2000));
                this.connection.sendEvent({
                    type: 'response.create'
                });
            }
            catch (error) {
                console.error('Error sending audio event:', error);
                throw error;
            }
        });
    }
    // WebSocket Connection Methods
    connect(websocketOrStream, sendOutputChunk) {
        return __awaiter(this, void 0, void 0, function* () {
            let inputStream = yield this.setupWebSocketConnection(websocketOrStream);
            const toolsByName = this.createToolsMap();
            const toolExecutor = new executor_1.VoiceToolExecutor(toolsByName);
            yield this.initializeConnection(toolsByName);
            yield this.handleStreamEvents(inputStream, toolExecutor, sendOutputChunk);
        });
    }
    setupWebSocketConnection(websocketOrStream) {
        return __awaiter(this, void 0, void 0, function* () {
            if ("next" in websocketOrStream) {
                return websocketOrStream;
            }
            yield this.waitForWebSocketOpen(websocketOrStream);
            websocketOrStream.binaryType = 'arraybuffer';
            this.setupBinaryMessageHandler(websocketOrStream);
            return (0, utils_1.createStreamFromWebsocket)(websocketOrStream);
        });
    }
    waitForWebSocketOpen(ws) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ws.readyState === ws_1.default.OPEN)
                return;
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error("WebSocket connection timed out after 10 seconds"));
                }, 10000);
                ws.once("connect", () => {
                    clearTimeout(timeout);
                    resolve();
                });
                ws.once("error", (error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });
        });
    }
    setupBinaryMessageHandler(ws) {
        ws.on('message', (data) => __awaiter(this, void 0, void 0, function* () {
            console.log('===Received binary message:', {
                type: data instanceof Buffer ? 'Buffer' : 'ArrayBuffer',
                size: Buffer.isBuffer(data) ? data.length : data.byteLength
            });
            if (data instanceof Buffer || data instanceof ArrayBuffer) {
                const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : data;
                yield this.connection.handleIncomingAudio(buffer);
            }
        }));
    }
    createToolsMap() {
        return this.tools.reduce((acc, tool) => {
            acc[tool.name] = tool;
            return acc;
        }, {});
    }
    initializeConnection(toolsByName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.connection.connect();
            const toolDefs = Object.values(toolsByName).map((tool) => ({
                type: "function",
                name: tool.name,
                description: tool.description,
                parameters: (0, zod_to_json_schema_1.default)(tool.schema),
            }));
            this.connection.sendEvent({
                type: "session.update",
                session: {
                    instructions: this.instructions,
                    input_audio_transcription: { model: "whisper-1" },
                    tools: toolDefs,
                    input_audio_format: "pcm16",
                    output_audio_format: "pcm16",
                },
            });
        });
    }
    handleStreamEvents(inputStream, toolExecutor, sendOutputChunk) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            const modelReceiveStream = this.connection.eventStream();
            try {
                for (var _d = true, _e = __asyncValues((0, utils_1.mergeStreams)({
                    input_mic: inputStream,
                    output_speaker: modelReceiveStream,
                    tool_outputs: toolExecutor.outputIterator(),
                })), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const [streamKey, dataRaw] = _c;
                    yield this.processStreamEvent(streamKey, dataRaw, toolExecutor, sendOutputChunk);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    processStreamEvent(streamKey, dataRaw, toolExecutor, sendOutputChunk) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = typeof dataRaw === "string" ? dataRaw : dataRaw;
            if (data === "START_RECORD") {
                this.startRecordingSession();
            }
            else if (data === "STOP_RECORD") {
                yield this.stopRecordingAndProcessAudio();
            }
            else {
                yield this.handleStreamOutput(streamKey, data, toolExecutor, sendOutputChunk);
            }
        });
    }
    handleStreamOutput(streamKey, data, toolExecutor, sendOutputChunk) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (streamKey) {
                case "tool_outputs":
                    this.connection.sendEvent(data);
                    this.connection.sendEvent({ type: "response.create", response: {} });
                    break;
                case "output_speaker":
                    yield this.handleSpeakerOutput(data, toolExecutor, sendOutputChunk);
                    break;
            }
        });
    }
    handleSpeakerOutput(data, toolExecutor, sendOutputChunk) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type } = data;
            if (type === "response.audio.delta" || type === "response.audio_buffer.speech_started") {
                yield sendOutputChunk(JSON.stringify(data));
            }
            else if (type === "error") {
                console.error("error:", data);
            }
            else if (type === "response.function_call_arguments.done") {
                toolExecutor.addToolCall(data);
            }
            else if (type === "response.audio_transcript.done") {
                console.log("model:", data.transcript);
            }
            else if (type === "conversation.item.input_audio_transcription.completed") {
                console.log("user:", data.transcript);
            }
            else if (!EVENTS_TO_IGNORE.includes(type)) {
                console.log(type);
            }
        });
    }
}
exports.OpenAIVoiceReactAgent = OpenAIVoiceReactAgent;
