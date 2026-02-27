import { Controller, Get } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller()
export class AppController {

  @Throttle({
    default: { limit: 5, ttl: 60 },
  })
  @Get()
  getRoot() {
    return { status: 'ok' };
  }
}