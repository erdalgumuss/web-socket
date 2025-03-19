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
exports.TOOLS = void 0;
const zod_1 = require("zod");
const tools_1 = require("@langchain/core/tools");
const tavily_search_1 = require("@langchain/community/tools/tavily_search");
const add = (0, tools_1.tool)((_a) => __awaiter(void 0, [_a], void 0, function* ({ a, b }) {
    return a + b;
}), {
    name: "add",
    description: "Add two numbers. Please let the user know that you're adding the numbers BEFORE you call the tool",
    schema: zod_1.z.object({
        a: zod_1.z.number(),
        b: zod_1.z.number(),
    }),
});
const tavilyTool = new tavily_search_1.TavilySearchResults({
    maxResults: 5,
    kwargs: {
        includeAnswer: true,
    },
});
tavilyTool.description = `This is a search tool for accessing the internet.\n\nLet the user know you're asking your friend Tavily for help before you call the tool.`;
exports.TOOLS = [add, tavilyTool];
