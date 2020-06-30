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
    this.exists(user);
    return new UserDto(user);
  }

  async findModelByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne<User>({
      where: {
        email
      }
    });
    this.exists(user);
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const user = new User();
    user.email = createUserDto.email;
    user.firstName = createUserDto.firstName;
    user.lastName = createUserDto.lastName;
    user.title = createUserDto.title;
    user.organization = createUserDto.organization;
    user.role = createUserDto.role;
    try {
      user.encryptedPassword = await hash(createUserDto.password, 14);
    } catch {
      throw new BadRequestException
    }
    const userData = await user.save();
    return new UserDto(userData);
  }

  async update(id: number, updateUserDto: UpdateUserDto, isAdmin: boolean) {
    const user = await this.userModel.findByPk<User>(id);
    this.exists(user);
    if(!isAdmin) {
      await this.testPassword(updateUserDto, user);
    }
    if(updateUserDto.password == null && user.forcePasswordChange) {
      throw new BadRequestException('You must change your password');
    } else if(updateUserDto.password) {
      user.encryptedPassword = await hash(updateUserDto.password, 14);
      user.passwordChangedAt = new Date();
      user.forcePasswordChange = false;
    }
    user.email = updateUserDto.email || user.email;
    user.firstName = updateUserDto.firstName || user.firstName;
    user.lastName = updateUserDto.lastName || user.lastName;
    user.title = updateUserDto.title || user.title;
    user.organization = updateUserDto.organization || user.organization;
    user.role = updateUserDto.role || user.role;
    user.forcePasswordChange = updateUserDto.forcePasswordChange || user.forcePasswordChange;
    const userData = await user.save();
    return new UserDto(userData);
  }

  async updateLoginMetadata(user: User) {
    this.exists(user);
    const id = user.id;
    user.lastLogin = new Date();
    user.loginCount++;
    await this.userModel.update<User>(user, {
      where: {
        id
      }
    });
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

  async testPassword(updateUserDto: UpdateUserDto, user: User) {
    try {
      if(!(await compare(updateUserDto.currentPassword, user.encryptedPassword))) {
        throw new UnauthorizedException;
      }
    } catch {
      throw new UnauthorizedException;
    }
  }
}
