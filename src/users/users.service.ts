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
    let user = await this.userModel.findByPk<User>(id);
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
    user.email = createUserDto.email;
    user.firstName = createUserDto.firstName;
    user.lastName = createUserDto.lastName;
    user.title = createUserDto.title;
    user.organization = createUserDto.organization;
    let userData = await user.save();
    return new UserDto(userData);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    let user = await this.userModel.findByPk<User>(id);
    user.email = updateUserDto.email || user.email;
    user.firstName = updateUserDto.firstName || user.firstName;
    user.lastName = updateUserDto.lastName || user.lastName;
    user.title = updateUserDto.title || user.title;
    user.organization = updateUserDto.organization || user.organization;
    let userData = await user.save();
    return new UserDto(userData);
  }

  async remove(id: number) {
    const user = await this.userModel.findByPk<User>(id);
    await user.destroy();
    return new UserDto(user);
  }
}
