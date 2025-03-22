import * as fs from 'fs';
import * as path from 'path';

import { Buffer } from 'buffer';
import { ESP_AUDIO_CONFIG } from '@/config/audioConfig';

export class Agent {
  constructor() {}

  /**
   * ESP’den gelen ses verisini alır, dosyaya kaydeder, 3 saniye bekler, geri gönderir
   */
  public async handleIncomingAudio(buffer: Buffer): Promise<Buffer> {
    try {
      console.log('[Agent] Ses alındı, kaydediliyor...');

      // 1. Dosya adı ve yolu
      const fileName = `esp-audio-${Date.now()}.pcm`;
      const filePath = path.resolve(__dirname, '../../tmp', fileName);

      // 2. Kaydet
      fs.writeFileSync(filePath, buffer);
      console.log(`[Agent] Ses dosyaya kaydedildi: ${filePath}`);

      // 3. 3 saniye bekle (test amaçlı gecikme)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 4. Dosyayı tekrar oku
      const responseBuffer = fs.readFileSync(filePath);
      console.log('[Agent] Ses tekrar okunup ESP32’ye gönderiliyor...');

      return responseBuffer;

    } catch (err) {
      console.error('[Agent] Test ajan hatası:', err);
      throw err;
    }
  }
}
