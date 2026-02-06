import { Org } from '../common/decorators/org.decorator';
import { Controller, Get, Patch, Req, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { BadRequestException,} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(
    @Req() req,
    @Org() organizationId: string,
  ) {
    return this.usersService.getMe(req.user.sub, organizationId);
}
}
