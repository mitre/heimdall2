import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import * as consts from '../test.constants';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDto } from './dto/user.dto';

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
                        create: jest.fn(CreateUserDto => consts.USER_ONE_DTO),
                        findById: jest.fn(number => consts.USER_ONE_DTO),
                        update: jest.fn((number, UpdateUserDto) => consts.USER_ONE_DTO),
                        remove: jest.fn((number, DeleteUserDto) => consts.USER_ONE_DTO)
                    })
                }
            ],
        }).compile();

        usersService = module.get<UsersService>(UsersService);
        usersController = module.get<UsersController>(UsersController);
    });

    // Tests the findById function
    it("should findById", async () => {
        expect(await usersController.findById(consts.ID)).toBe(consts.USER_ONE_DTO);
        expect(usersService.findById).toHaveReturnedWith(consts.USER_ONE_DTO);
    });

    // Tests the create function
    it("should create", async () => {
        expect(await usersController.create(consts.CREATE_USER_DTO_TEST_OBJ)).toEqual(consts.USER_ONE_DTO);
        expect(usersService.create).toHaveReturnedWith(consts.USER_ONE_DTO);
    });

    // Tests the update function
    it("should update", async () => {
        expect(await usersController.update(consts.ID, consts.UPDATE_USER_DTO_TEST_OBJ)).toEqual(consts.USER_ONE_DTO);
        expect(usersService.update).toHaveReturnedWith(consts.USER_ONE_DTO);
    });

    // Tests the remove function
    it("should remove", async () => {
        expect(await usersController.remove(consts.ID, consts.DELETE_USER_DTO_TEST_OBJ)).toEqual(consts.USER_ONE_DTO);
        expect(usersService.remove).toHaveReturnedWith(consts.USER_ONE_DTO);
    });
});
