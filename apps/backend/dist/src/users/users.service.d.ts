/// <reference types="node" />
import { Ability } from '@casl/ability';
import { FindOptions } from 'sequelize/types';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.model';
export declare class UsersService {
    private userModel;
    constructor(userModel: typeof User);
    adminFindAll(): Promise<User[]>;
    userFindAll(): Promise<User[]>;
    count(): Promise<number>;
    findById(id: string): Promise<User>;
    findByEmail(email: string): Promise<User>;
    create(createUserDto: CreateUserDto): Promise<User>;
    update(userToUpdate: User, updateUserDto: UpdateUserDto, abac: Ability): Promise<User>;
    updateLoginMetadata(user: User): Promise<void>;
    remove(userToDelete: User, deleteUserDto: DeleteUserDto, abac: Ability): Promise<User>;
    findByPkBang(identifier: string | number | Buffer | undefined): Promise<User>;
    findOneBang(options: FindOptions | undefined): Promise<User>;
    testPassword(updateUserDto: UpdateUserDto, user: User): Promise<void>;
}
