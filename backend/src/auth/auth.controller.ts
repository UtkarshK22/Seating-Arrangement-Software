import {
  Controller,
  Post,
  Body,
  Get,
  Req,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* ==========================
     REGISTER (PUBLIC)
  ========================== */

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /* ==========================
     LOGIN (PUBLIC)
  ========================== */

  @Public()
  @Post('login')
  login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('organizationId') organizationId: string,
  ) {
    return this.authService.login(
      email,
      password,
      organizationId,
    );
  }

  /* ==========================
     PROTECTED TEST
  ========================== */

  @Get('protected')
  getProtected(@Req() req: any) {
    return {
      message: 'You are authorized',
      user: req.user,
    };
  }
}