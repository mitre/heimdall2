import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {compare, hash} from 'bcrypt';
import {FindOptions} from 'sequelize/types';
import {CreateUserDto} from './dto/create-user.dto';
import {DeleteUserDto} from './dto/delete-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {UserDto} from './dto/user.dto';
import {User} from './user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User
  ) {}

  async findAll(): Promise<UserDto[]> {
    const users = await this.userModel.findAll<User>();
    return users.map((user) => new UserDto(user));
  }

  async findById(id: number): Promise<UserDto> {
    const user = await this.findByPkBang(id);
    return new UserDto(user);
  }

  async findByEmail(email: string): Promise<UserDto> {
    const user = await this.findOneBang({
      where: {
        email
      }
    });
    return new UserDto(user);
  }

  async findModelByEmail(email: string): Promise<User> {
    return this.findOneBang({
      where: {
        email
      }
    });
  }

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const user = new User();
    user.email = createUserDto.email;
    user.firstName = createUserDto.firstName || undefined;
    user.lastName = createUserDto.lastName || undefined;
    user.title = createUserDto.title || undefined;
    user.organization = createUserDto.organization || undefined;
    user.role = createUserDto.role;
    try {
      user.encryptedPassword = await hash(createUserDto.password, 14);
    } catch {
      throw new BadRequestException();
    }
    const userData = await user.save();
    return new UserDto(userData);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    isAdmin: boolean
  ): Promise<UserDto> {
    const user = await this.findByPkBang(id);
    if (!isAdmin) {
      await this.testPassword(updateUserDto, user);
    }
    if (updateUserDto.password == null && user.forcePasswordChange) {
      throw new BadRequestException('You must change your password');
    } else if (updateUserDto.password) {
      user.encryptedPassword = await hash(updateUserDto.password, 14);
      user.passwordChangedAt = new Date();
      user.forcePasswordChange = false;
    }
    user.email = updateUserDto.email || user.email;
    user.firstName = updateUserDto.firstName || user.firstName;
    user.lastName = updateUserDto.lastName || user.lastName;
    user.title = updateUserDto.title || user.title;
    user.organization = updateUserDto.organization || user.organization;
    if (isAdmin) {
      // Only admins can update roles
      user.role = updateUserDto.role || user.role;
    }
    user.forcePasswordChange =
      updateUserDto.forcePasswordChange || user.forcePasswordChange;
    const userData = await user.save();
    return new UserDto(userData);
  }

  async updateLoginMetadata(user: User): Promise<void> {
    user.lastLogin = new Date();
    user.loginCount++;
    await user.save();
  }

  async remove(
    id: number,
    deleteUserDto: DeleteUserDto,
    isAdmin: boolean
  ): Promise<UserDto> {
    const user = await this.findByPkBang(id);
    if (!isAdmin) {
      try {
        if (!(await compare(deleteUserDto.password, user.encryptedPassword))) {
          throw new ForbiddenException();
        }
      } catch {
        throw new ForbiddenException();
      }
    }
    await user.destroy();
    return new UserDto(user);
  }

  async findByPkBang(
    identifier: string | number | Buffer | undefined
  ): Promise<User> {
    const user = await this.userModel.findByPk<User>(identifier);
    if (user === null) {
      throw new NotFoundException('User with given id not found');
    } else {
      return user;
    }
  }

  async findOneBang(options: FindOptions | undefined): Promise<User> {
    const user = await this.userModel.findOne<User>(options);
    if (user === null) {
      throw new NotFoundException('User with given id not found');
    } else {
      return user;
    }
  }

  async testPassword(updateUserDto: UpdateUserDto, user: User): Promise<void> {
    try {
      if (
        !(await compare(updateUserDto.currentPassword, user.encryptedPassword))
      ) {
        throw new ForbiddenException('Current password is incorrect');
      }
    } catch {
      throw new ForbiddenException('Current password is incorrect');
    }
  }
}
