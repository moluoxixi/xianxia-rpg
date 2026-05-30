import 'reflect-metadata';
import fs from 'node:fs';
import path from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: true });

  const staticRoot = process.env.XIANXIA_WEB_DIST_DIR ?? path.resolve(__dirname, '../../../..', 'web');
  if (fs.existsSync(staticRoot)) {
    app.useStaticAssets(staticRoot);
  }

  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
}

void bootstrap();
