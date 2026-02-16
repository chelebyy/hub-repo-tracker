import pino from 'pino';
import { config } from './config/index.js';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

// logs klasörünü oluştur
const logPath = config.logPath;
mkdirSync(logPath, { recursive: true });

// Tarih bazlı dosya adı (YYYY-MM-DD)
const today = new Date().toISOString().slice(0, 10);
const logFile = join(logPath, `app-${today}.log`);

export const logger = pino(
  { level: config.logLevel },
  pino.transport({
    targets: [
      // stdout (development'da pretty, production'da JSON)
      {
        target: config.nodeEnv === 'development' ? 'pino-pretty' : 'pino/file',
        options: config.nodeEnv === 'development'
          ? { colorize: true }
          : { destination: 1 },
        level: config.logLevel,
      },
      // dosya (her zaman JSON)
      {
        target: 'pino/file',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: { destination: logFile } as any,
        level: config.logLevel,
      },
    ],
  })
);
