"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// const handleAudioData = (data: ArrayBuffer, handler: AudioHandler): void => {
//   const uint8Array = new Uint8Array(data);
//   appendToBuffer(uint8Array, handler);
//   if (handler.buffer.length >= handler.BUFFER_SIZE) {
//     const toSend = new Uint8Array(handler.buffer.slice(0, handler.BUFFER_SIZE));
//     handler.buffer = new Uint8Array(handler.buffer.slice(handler.BUFFER_SIZE));
//     const regularArray = String.fromCharCode(...toSend);
//     const base64 = btoa(regularArray);
//     handler.ws.send(JSON.stringify({
//       type: 'input_audio_buffer.append',
//       audio: base64
//     }));
//   }
// };
// const audioHandler: AudioHandler = {
//   buffer: new Uint8Array(),
//   BUFFER_SIZE: 8192, // Common audio buffer size, adjust as needed
//   ws: new WebSocket('ws://localhost:3000/ws')
// };
