import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==========================
  // REGISTER
  // ==========================
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ==========================
  // LOGIN
  // ==========================
  @Post('login')
  login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('organizationId') organizationId: string,
  ) {
    return this.authService.login(email, password, organizationId);
  }

  // ==========================
  // PROTECTED TEST
  // ==========================
  @UseGuards(JwtAuthGuard)
  @Get('protected')
  getProtected(@Req() req: any) {
    return {
      message: 'You are authorized',
      user: req.user,
    };
  }
}
