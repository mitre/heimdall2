import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('authn')
export class AuthnController {
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    console.log('Here');
    return req.user;
  }
}
