import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { UserDto } from './dto/user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { hash, compare } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User
  ) {}

  async findAll(): Promise<UserDto[]> {
    const users =  await this.userModel.findAll<User>();
    return users.map(user => new UserDto(user))
  }

  async findById(id: number): Promise<UserDto> {
    const user = await this.userModel.findByPk<User>(id);
    this.exists(user);
    return new UserDto(user);
  }

  async findByEmail(email: string): Promise<UserDto> {
    const user = await this.userModel.findOne<User>({
      where: {
        email
      }
    });
    this.exists(user)
    return new UserDto(user);
  }

  async create(createUserDto: CreateUserDto) {
    const user = new User();
    user.email = createUserDto.email;
    user.firstName = createUserDto.firstName;
    user.lastName = createUserDto.lastName;
    user.title = createUserDto.title;
    user.organization = createUserDto.organization;
    user.encryptedPassword = await hash(createUserDto.password, 14);
    const userData = await user.save();
    return new UserDto(userData);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findByPk<User>(id);
    this.exists(user);
    if(!(await compare(updateUserDto.currentPassword, user.encryptedPassword))) {
      throw new UnauthorizedException;
    }
    user.email = updateUserDto.email || user.email;
    user.firstName = updateUserDto.firstName || user.firstName;
    user.lastName = updateUserDto.lastName || user.lastName;
    user.title = updateUserDto.title || user.title;
    user.organization = updateUserDto.organization || user.organization;
    if(updateUserDto.password) {
      user.encryptedPassword = await hash(updateUserDto.password, 14);
      user.passwordChangedAt = new Date();
      user.forcePasswordChange = false;
    }
    const userData = await user.save();
    return new UserDto(userData);
  }

  async remove(id: number) {
    const user = await this.userModel.findByPk<User>(id);
    this.exists(user);
    await user.destroy();
    return new UserDto(user);
  }

  exists(user: User) : void {
    if (!user) {
      throw new NotFoundException('User with given id not found');
    }
  }
}
