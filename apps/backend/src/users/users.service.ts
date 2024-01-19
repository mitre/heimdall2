import {Ability} from '@casl/ability';
import {comparePassword, hashAndSaltPassword} from '@heimdall/common/crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {FindOptions} from 'sequelize';
import {v4} from 'uuid';
import {AuthnService} from '../authn/authn.service';
import {Action} from '../casl/casl-ability.factory';
import {ConfigService} from '../config/config.service';
import {GroupsService} from '../groups/groups.service';
import {CreateUserDto} from './dto/create-user.dto';
import {DeleteUserDto} from './dto/delete-user.dto';
import {UpdateUserDto} from './dto/update-user.dto';
import {User} from './user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly configService: ConfigService,
    private readonly groupsService: GroupsService
  ) {}

  async adminFindAllUsers(): Promise<User[]> {
    return this.userModel.findAll<User>();
  }

  async findAllUsers(): Promise<User[]> {
    return this.userModel.findAll<User>({
      attributes: ['id', 'email', 'title', 'firstName', 'lastName']
    });
  }

  async count(): Promise<number> {
    return this.userModel.count();
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

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = new User();
    user.email = createUserDto.email;
    user.firstName = createUserDto.firstName || undefined;
    user.lastName = createUserDto.lastName || undefined;
    user.title = createUserDto.title || undefined;
    user.organization = createUserDto.organization || undefined;
    user.role = createUserDto.role;
    user.creationMethod = createUserDto.creationMethod;
    try {
      user.encryptedPassword = await hashAndSaltPassword(
        createUserDto.password,
        !(
          this.configService
            .get('USE_NEW_ENCRYPTION_STRATEGY')
            ?.toLowerCase() === 'true'
        )
      );
    } catch {
      throw new BadRequestException();
    }
    return user.save();
  }

  async update(
    userToUpdate: User,
    updateUserDto: UpdateUserDto,
    abac: Ability
  ): Promise<User> {
    if (!abac.can('update-no-password', userToUpdate)) {
      await AuthnService.prototype.testPassword(updateUserDto, userToUpdate, this.configService);
    }
    if (
      updateUserDto.password === null &&
      userToUpdate.forcePasswordChange &&
      !abac.can('skip-force-password-change', userToUpdate)
    ) {
      throw new BadRequestException('You must change your password');
    } else if (updateUserDto.password) {
      userToUpdate.encryptedPassword = await hashAndSaltPassword(
        updateUserDto.password,
        !(
          this.configService
            .get('USE_NEW_ENCRYPTION_STRATEGY')
            ?.toLowerCase() === 'true'
        )
      );
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
    return userToUpdate.save();
  }

  async updateLoginMetadata(user: User): Promise<void> {
    user.lastLogin = new Date();
    user.loginCount++;
    await user.save();
  }

  async updateUserSecret(user: User): Promise<void> {
    user.jwtSecret = v4();
    await user.save();
  }

  async remove(
    userToDelete: User,
    deleteUserDto: DeleteUserDto,
    abac: Ability
  ): Promise<User> {
    if (
      abac.cannot(Action.DeleteNoPassword, userToDelete) &&
      !(await comparePassword(
        deleteUserDto.password || '',
        userToDelete.encryptedPassword,
        !(
          this.configService
            .get('USE_NEW_ENCRYPTION_STRATEGY')
            ?.toLowerCase() === 'true'
        )
      ))
    ) {
      throw new ForbiddenException(
        'Password was incorrect, could not delete account'
      );
    }

    const adminCount = await this.userModel.count({where: {role: 'admin'}});
    // Do not allow the administrator to destroy the only
    // administrator account
    if (userToDelete.role === 'admin' && adminCount < 2) {
      throw new ForbiddenException(
        'Cannot destroy only administrator account, please promote another user to administrator first'
      );
    }
    // Clean up groups owned by user
    await Promise.all(
      (
        await this.groupsService.findAll()
      ).map(async (group) => {
        if (group.users.some((user) => user.id === userToDelete.id)) {
          await this.groupsService.ensureGroupHasOwner(group, userToDelete);
        }
      })
    );
    await userToDelete.destroy();
    return userToDelete;
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
}
