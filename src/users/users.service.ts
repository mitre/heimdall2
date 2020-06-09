import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { UserDto } from './dto/user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
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
    try {
      user.encryptedPassword = await hash(createUserDto.password, 14);
    } catch {
      throw new BadRequestException
    }
    const userData = await user.save();
    return new UserDto(userData);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findByPk<User>(id);
    this.exists(user);
    try {
      if(!(await compare(updateUserDto.password, user.encryptedPassword))) {
        throw new UnauthorizedException;
      }
    } catch {
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

  async remove(id: number, deleteUserDto: DeleteUserDto) {
    const user = await this.userModel.findByPk<User>(id);
    this.exists(user);
    try {
      if(!(await compare(deleteUserDto.password, user.encryptedPassword))) {
        throw new UnauthorizedException;
      }
    } catch {
      throw new UnauthorizedException;
    }
    await user.destroy();
    return new UserDto(user);
  }

  exists(user: User) : boolean {
    if (!user) {
      throw new NotFoundException('User with given id not found');
    } else {
      return true;
    }
  }
}
