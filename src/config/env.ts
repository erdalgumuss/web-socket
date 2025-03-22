import * as dotenv from 'dotenv';
import { z } from 'zod';

// .env dosyasını yükle
dotenv.config();

// Geçerli ortam değişkenlerini tanımla
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),

  // OpenAI ayarları
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_MODEL: z.string().default('gpt-4o'),

  // STT ve TTS ayarları (isteğe bağlı)
  USE_WHISPER: z.string().optional(),
  USE_TTS: z.string().optional(),

  // Sunucu ayarları
  PORT: z.coerce.number().default(3000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
