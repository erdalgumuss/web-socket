import { ESP_AUDIO_CONFIG, MAX_AUDIO_BUFFER_SIZE, MIN_AUDIO_BUFFER_SIZE, AUDIO_WRITE_DELAY } from '@/config/audioConfig';
import { appendToBuffer } from '@/utils/audioUtils';
import { Buffer } from 'buffer';

export class InputProcessor {
  private buffer: Uint8Array = new Uint8Array();
  private writeTimeout: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(private onAudioReady: (buffer: Buffer) => Promise<void>) {}

  /**
   * ESP'den gelen her yeni audio chunk burada işlenir
   */
  public handleIncomingChunk(chunk: Uint8Array) {
    this.buffer = appendToBuffer(this.buffer, chunk);

    // Aşırı büyükse erken işlemeye zorla
    if (this.buffer.length >= MAX_AUDIO_BUFFER_SIZE) {
      this.flushBuffer();
      return;
    }

    // Yazma zamanlayıcısını sıfırla
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }

    this.writeTimeout = setTimeout(() => {
      if (this.buffer.length >= MIN_AUDIO_BUFFER_SIZE) {
        this.flushBuffer();
      }
    }, AUDIO_WRITE_DELAY);
  }

  /**
   * Buffer işlenmeye hazır hale geldiğinde dışarı gönder
   */
  private async flushBuffer() {
    if (this.isProcessing || this.buffer.length === 0) return;

    this.isProcessing = true;

    const bufferToSend = Buffer.from(this.buffer);
    this.buffer = new Uint8Array();

    try {
      await this.onAudioReady(bufferToSend);
    } catch (err) {
      console.error('Error processing audio buffer:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Bağlantı kapandığında timeout'u temizle
   */
  public cleanup() {
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
    }
    this.buffer = new Uint8Array();
  }
}
