export interface AudioConfig {
    sampleRate: number;
    channels: number;
    bitDepth: number;
  }
  
  // ESP32 için önerilen sabit ayarlar
  export const ESP_AUDIO_CONFIG: AudioConfig = {
    sampleRate: 24000, // ESP32 için optimum (16k de olabilir ama 24k daha net)
    channels: 1,        // Mono mikrofon
    bitDepth: 16        // 16-bit PCM (MAX98357 uyumlu)
  };
  
  // Kalite seviyeleri (isteğe bağlı kullanabilirsin)
  export const AudioPresets = {
    low: {
      sampleRate: 16000,
      channels: 1,
      bitDepth: 16
    },
    medium: ESP_AUDIO_CONFIG,
    high: {
      sampleRate: 44100,
      channels: 1,
      bitDepth: 16
    },
    ultra: {
      sampleRate: 96000,
      channels: 1,
      bitDepth: 16
    }
  };
  
  // Buffer ayarları
  export const MAX_AUDIO_BUFFER_SIZE = 1024 * 1024; // 1 MB
  export const MIN_AUDIO_BUFFER_SIZE = ESP_AUDIO_CONFIG.sampleRate; // 1 saniyelik veri
  export const AUDIO_WRITE_DELAY = 500; // ms, son ses verisinden sonra ne kadar beklenmeli
  