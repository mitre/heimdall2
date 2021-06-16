import { AuthzService } from '../authz/authz.service';
import { ConfigService } from '../config/config.service';
import { User } from '../users/user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { SlimUserDto } from './dto/slim-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    private readonly configService;
    private readonly authz;
    constructor(usersService: UsersService, configService: ConfigService, authz: AuthzService);
    userFindAll(request: {
        user: User;
    }): Promise<SlimUserDto[]>;
    findById(id: string, request: {
        user: User;
    }): Promise<UserDto>;
    adminFindAll(request: {
        user: User;
    }): Promise<UserDto[]>;
    create(createUserDto: CreateUserDto, request: {
        user?: User;
    }): Promise<UserDto>;
    update(id: string, request: {
        user: User;
    }, updateUserDto: UpdateUserDto): Promise<UserDto>;
    remove(id: string, request: {
        user: User;
    }, deleteUserDto: DeleteUserDto): Promise<UserDto>;
    clear(): Promise<void>;
}
