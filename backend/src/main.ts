import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Environment-based allowed origins
  const allowedOrigins = [
    'http://localhost:5173', // Local Vite dev
    process.env.FRONTEND_URL, // Production frontend (set in Railway)
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser tools like Postman
      if (!origin) return callback(null, true);

      // Allow exact matches
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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ✅ ROOT ROUTE FOR RAILWAY HEALTHCHECK
  const server = app.getHttpAdapter().getInstance();
  server.get('/', (_req, res) => {
    res.status(200).send('OK');
  });

  const port = parseInt(process.env.PORT ?? '8080', 10);
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();