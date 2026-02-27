import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /* =============================
     LOGGER (structured pino)
  ============================== */
  app.useLogger(app.get(Logger));

  /* =============================
     SECURITY HEADERS (Helmet)
  ============================== */
  app.use(helmet());

  /* =============================
     STRICT CORS (Multi-env safe)
  ============================== */
  const allowedOrigins = [
    'http://localhost:5173',          // Local Vite
    process.env.FRONTEND_URL,         // Production frontend
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser tools (Postman, curl)
      if (!origin) return callback(null, true);

      // Exact allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments
      if (/\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  /* =============================
     GLOBAL VALIDATION
  ============================== */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /* =============================
     ROOT ROUTE (Railway healthcheck)
  ============================== */
  const server = app.getHttpAdapter().getInstance();
  server.get('/', (_req, res) => {
    res.status(200).send('OK');
  });

  /* =============================
     START SERVER
  ============================== */
  const port = parseInt(process.env.PORT ?? '8080', 10);
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();