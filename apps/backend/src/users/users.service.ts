import {Ability} from '@casl/ability';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {compare, hash} from 'bcrypt';
import {FindOptions} from 'sequelize/types';
import {Action} from '../casl/casl-ability.factory';
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

  async findById(id: string): Promise<User> {
    return this.findByPkBang(id);
  }

  async findByEmail(email: string): Promise<User> {
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
    user.creationMethod = createUserDto.creationMethod;
    try {
      user.encryptedPassword = await hash(createUserDto.password, 14);
    } catch {
      throw new BadRequestException();
    }
    const userData = await user.save();
    return new UserDto(userData);
  }

  async update(
    userToUpdate: User,
    updateUserDto: UpdateUserDto,
    abac: Ability
  ): Promise<UserDto> {
    if (!abac.can('update-no-password', userToUpdate)) {
      await this.testPassword(updateUserDto, userToUpdate);
    }
    if (
      updateUserDto.password == null &&
      userToUpdate.forcePasswordChange &&
      !abac.can('skip-force-password-change', userToUpdate)
    ) {
      throw new BadRequestException('You must change your password');
    } else if (updateUserDto.password) {
      userToUpdate.encryptedPassword = await hash(updateUserDto.password, 14);
      userToUpdate.passwordChangedAt = new Date();
      userToUpdate.forcePasswordChange = false;
    }
    userToUpdate.email = updateUserDto.email || userToUpdate.email;
    userToUpdate.firstName = updateUserDto.firstName || userToUpdate.firstName;
    userToUpdate.lastName = updateUserDto.lastName || userToUpdate.lastName;
    userToUpdate.title = updateUserDto.title || userToUpdate.title;
    userToUpdate.organization =
      updateUserDto.organization || userToUpdate.organization;
    if (abac.can('update-role', userToUpdate)) {
      // Only admins can update roles
      userToUpdate.role = updateUserDto.role || userToUpdate.role;
    }
    userToUpdate.forcePasswordChange =
      updateUserDto.forcePasswordChange || userToUpdate.forcePasswordChange;
    const userData = await userToUpdate.save();
    return new UserDto(userData);
  }

  async updateLoginMetadata(user: User): Promise<void> {
    user.lastLogin = new Date();
    user.loginCount++;
    await user.save();
  }

  async remove(
    userToDelete: User,
    deleteUserDto: DeleteUserDto,
    abac: Ability
  ): Promise<UserDto> {
    if (abac.cannot(Action.DeleteNoPassword, userToDelete)) {
      try {
        if (
          !(await compare(
            deleteUserDto.password,
            userToDelete.encryptedPassword
          ))
        ) {
          throw new ForbiddenException();
        }
      } catch {
        throw new ForbiddenException(
          'Password was incorrect, could not delete account'
        );
      }
    }
    const adminCount = await this.userModel.count({where: {role: 'admin'}});
    // Do not allow the administrator to destroy the only
    // administrator account
    if (userToDelete.role === 'admin' && adminCount < 2) {
      throw new ForbiddenException(
        'Cannot destroy only administrator account, please promote another user to administrator first'
      );
    }
    await userToDelete.destroy();
    return new UserDto(userToDelete);
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
