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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceToolExecutor = void 0;
class VoiceToolExecutor {
    constructor(toolsByName) {
        this.triggerPromise = null;
        this.triggerResolve = null;
        this.lock = null;
        this.toolsByName = toolsByName;
    }
    triggerFunc() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.triggerPromise) {
                this.triggerPromise = new Promise((resolve) => {
                    this.triggerResolve = resolve;
                });
            }
            return this.triggerPromise;
        });
    }
    addToolCall(toolCall) {
        return __awaiter(this, void 0, void 0, function* () {
            while (this.lock) {
                yield this.lock;
            }
            this.lock = (() => __awaiter(this, void 0, void 0, function* () {
                if (this.triggerResolve) {
                    this.triggerResolve(toolCall);
                    this.triggerPromise = null;
                    this.triggerResolve = null;
                }
                else {
                    throw new Error("Tool call adding already in progress");
                }
            }))();
            yield this.lock;
            this.lock = null;
        });
    }
    createToolCallTask(toolCall) {
        return __awaiter(this, void 0, void 0, function* () {
            const tool = this.toolsByName[toolCall.name];
            if (!tool) {
                throw new Error(`Tool ${toolCall.name} not found. Must be one of ${Object.keys(this.toolsByName)}`);
            }
            let args;
            try {
                args = JSON.parse(toolCall.arguments);
            }
            catch (error) {
                throw new Error(`Failed to parse arguments '${toolCall.arguments}'. Must be valid JSON.`);
            }
            const result = yield tool.call(args);
            const resultStr = typeof result === "string" ? result : JSON.stringify(result);
            return {
                type: "conversation.item.create",
                item: {
                    id: toolCall.call_id,
                    call_id: toolCall.call_id,
                    type: "function_call_output",
                    output: resultStr,
                },
            };
        });
    }
    outputIterator() {
        return __asyncGenerator(this, arguments, function* outputIterator_1() {
            while (true) {
                const toolCall = yield __await(this.triggerFunc());
                try {
                    const result = yield __await(this.createToolCallTask(toolCall));
                    yield yield __await(result);
                }
                catch (error) {
                    yield yield __await({
                        type: "conversation.item.create",
                        item: {
                            id: toolCall.call_id,
                            call_id: toolCall.call_id,
                            type: "function_call_output",
                            output: `Error: ${error.message}`,
                        },
                    });
                }
            }
        });
    }
}
exports.VoiceToolExecutor = VoiceToolExecutor;
