import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserDto } from '../users/dto/user.dto';
import { compare } from 'bcrypt';

@Injectable()
export class AuthnService {
  constructor(private usersService: UsersService) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findModelByEmail(email);
    if(user && (await compare(password, user.encryptedPassword))) {
      return new UserDto(user);
    } else {
      return null;
    }
  }
}
