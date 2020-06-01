import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import * as consts from '../test.constants';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';

// Test suite for the UsersController
describe("UsersController Unit Tests", () => {
    let usersController: UsersController;
    let usersService: UsersService;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useFactory: () => ({
                        create: jest.fn(CreateUserDto => UserDto),
                        findById: jest.fn(number => UserDto),
                        update: jest.fn((number, UpdateUserDto) => UserDto),
                        remove: jest.fn((number, DeleteUserDto) => UserDto)
                    })
                }
            ],
        }).compile();

        usersService = module.get<UsersService>(UsersService);
        usersController = module.get<UsersController>(UsersController);
    });

    // Tests the findById function
    it("should findById", () => {
        usersController.findById(consts.ID);
        expect(usersService.findById).toHaveBeenCalledWith(consts.ID);
        expect(usersService.findById).toBeCalledTimes(1);
    });

    // Tests the create function
    it("should create", async () => {
        usersController.create(consts.CREATE_USER_DTO_TEST_OBJ);
        expect(usersService.create).toHaveBeenCalledWith(consts.CREATE_USER_DTO_TEST_OBJ);
        expect(usersService.create).toBeCalledTimes(1);
    });

    // Tests the update function
    it("should update", () => {
        usersController.update(consts.ID, consts.UPDATE_USER_DTO_TEST_OBJ);
        expect(usersService.update).toHaveBeenCalledWith(consts.ID, consts.UPDATE_USER_DTO_TEST_OBJ);
        expect(usersService.update).toBeCalledTimes(1);
    });

    // Tests the remove function
    it("should remove", () => {
        usersController.remove(consts.ID, consts.DELETE_USER_DTO_TEST_OBJ);
        expect(usersService.remove).toHaveBeenCalledWith(consts.ID, consts.DELETE_USER_DTO_TEST_OBJ);
        expect(usersService.remove).toBeCalledTimes(1);
    });
});