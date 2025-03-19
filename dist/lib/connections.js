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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIWebSocketConnection = void 0;
const utils_1 = require("./utils");
const ws_1 = __importDefault(require("ws"));
const DEFAULT_MODEL = "gpt-4o-realtime-preview";
const DEFAULT_URL = "wss://api.openai.com/v1/realtime";
const DEFAULT_AUDIO_CONFIG = {
    sampleRate: 44100, // ESP32 default sample rate
    channels: 1, // Mono audio
    bitDepth: 16 // 16-bit PCM
};
class OpenAIWebSocketConnection {
    constructor(params) {
        var _a, _b, _c, _d;
        this.isRecording = true;
        this.url = (_a = params.url) !== null && _a !== void 0 ? _a : DEFAULT_URL;
        this.model = (_b = params.model) !== null && _b !== void 0 ? _b : DEFAULT_MODEL;
        this.apiKey = (_c = params.apiKey) !== null && _c !== void 0 ? _c : process.env.OPENAI_API_KEY;
        this.audioConfig = (_d = params.audioConfig) !== null && _d !== void 0 ? _d : DEFAULT_AUDIO_CONFIG;
        this.audioManager = params.audioManager;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const headers = {
                Authorization: `Bearer ${this.apiKey}`,
                "OpenAI-Beta": "realtime=v1",
            };
            const finalUrl = `${this.url}?model=${this.model}`;
            this.ws = new ws_1.default(finalUrl, { headers });
            yield new Promise((resolve, reject) => {
                if (!this.ws) {
                    reject(new Error("WebSocket was not initialized"));
                    return;
                }
                const timeout = setTimeout(() => {
                    reject(new Error("Connection timed out after 10 seconds."));
                }, 10000);
                const onOpen = () => {
                    clearTimeout(timeout);
                    resolve();
                };
                const onError = (error) => {
                    clearTimeout(timeout);
                    reject(error);
                };
                if (this.ws.readyState === ws_1.default.OPEN) {
                    onOpen();
                }
                else {
                    this.ws.once("open", onOpen);
                    this.ws.once("error", onError);
                }
            });
        });
    }
    sendEvent(event) {
        var _a;
        const formattedEvent = JSON.stringify(event);
        if (this.ws === undefined) {
            throw new Error("Socket connection is not active, call .connect() first");
        }
        (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(formattedEvent);
    }
    eventStream() {
        return __asyncGenerator(this, arguments, function* eventStream_1() {
            if (!this.ws) {
                throw new Error("Socket connection is not active, call .connect() first");
            }
            yield __await(yield* __asyncDelegator(__asyncValues((0, utils_1.createStreamFromWebsocket)(this.ws))));
        });
    }
    handleButtonState(buttonState) {
        this.isRecording = buttonState;
        if (buttonState) {
            console.log('Started recording');
            // Optionally send a start recording event to OpenAI
            // this.sendEvent({
            //     type: "session.update",
            //     session: {
            //         recording_started: true
            //     }
            // });
        }
        else {
            console.log('Stopped recording');
            // Send end of audio stream marker
            // this.sendEvent({
            //   type: "input_audio_buffer.commit"
            // });
        }
    }
    handleIncomingAudio(data) {
        this.audioManager.handleAudioBuffer(data);
    }
}
exports.OpenAIWebSocketConnection = OpenAIWebSocketConnection;
