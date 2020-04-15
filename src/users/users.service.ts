import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { UserDto } from './dto/user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User
  ) {}

  async findAll(): Promise<UserDto[]> {
    let users =  await this.userModel.findAll<User>();
    return users.map(user => new UserDto(user))
  }

  async findById(id: number): Promise<UserDto> {
    let user = await this.userModel.findOne<User>({
      where: {
        id
      }
    });
    return new UserDto(user);
  }

  async findByEmail(email: string): Promise<UserDto> {
    let user = await this.userModel.findOne<User>({
      where: {
        email
      }
    });
    return new UserDto(user);
  }

  async create(createUserDto: CreateUserDto) {
    let user = new User();
    const userData = await user.save();
    return userData;
  }

  async remove(id: number) {
    const user = await this.userModel.findOne<User>({
      where: {
        id
      }
    });
    await user.destroy();
    return new UserDto(user);
  }
}
