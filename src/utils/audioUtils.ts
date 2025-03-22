import { Buffer } from 'buffer';

/**
 * Uint8Array buffer’larını birleştirir
 */
export function appendToBuffer(current: Uint8Array, incoming: Uint8Array): Uint8Array {
  const newBuffer = new Uint8Array(current.length + incoming.length);
  newBuffer.set(current);
  newBuffer.set(incoming, current.length);
  return newBuffer;
}

/**
 * Float32Array → 16-bit PCM → ArrayBuffer
 */
function floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/**
 * Float32Array → base64 kodlu PCM16
 */
export function base64EncodeAudio(float32Array: Float32Array): string {
  const pcmBuffer = floatTo16BitPCM(float32Array);
  return Buffer.from(pcmBuffer).toString('base64');
}

/**
 * Int16 PCM → Float32 PCM dönüşümü
 */
export function processAudioBuffer(buffer: Buffer): Buffer {
  const int16 = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768;
  }
  return Buffer.from(float32.buffer);
}

/**
 * PCM16 ses verisini yeniden örnekleyip (resample) base64'e çevirir
 */
export function convertAudioToPCM16(
  audioBuffer: Buffer,
  sourceRate: number = 44100,
  targetRate: number = 24000
): string {
  const view = new DataView(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.byteLength);
  const ratio = sourceRate / targetRate;
  const resampledLength = Math.floor(audioBuffer.byteLength / 2 / ratio);
  const pcm16Data = new Int16Array(resampledLength);

  for (let i = 0; i < resampledLength; i++) {
    const srcIndex = i * ratio;
    const intIndex = Math.floor(srcIndex);
    const frac = srcIndex - intIndex;

    const s1 = view.getInt16(intIndex * 2, true);
    const s2 = intIndex < (audioBuffer.byteLength / 2 - 1)
      ? view.getInt16((intIndex + 1) * 2, true)
      : s1;

    pcm16Data[i] = Math.round(s1 * (1 - frac) + s2 * frac);
  }

  return Buffer.from(pcm16Data.buffer).toString('base64');
}
