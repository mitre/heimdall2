import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';

// Test suite for the UsersController
describe("UsersController", () => {
    let usersController: UsersController;
    let usersService: UsersService;
    let module: TestingModule;

    const ID: number = 7;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useFactory: () => ({
                        create: jest.fn(),
                        findById: jest.fn(),
                        update: jest.fn(),
                        remove: jest.fn()
                    })
                }
            ],
        }).compile();

        usersService = module.get<UsersService>(UsersService);
        usersController = module.get<UsersController>(UsersController);
    });

    describe("UsersController", () => {
        // Tests the findById function
        it("should findById", () => {
            usersController.findById(ID);
            expect(usersService.findById).toHaveBeenCalledWith(ID);
            expect(usersService.findById).toBeCalledTimes(1);
        });

        // Tests the create function
        it("should create", async () => {
            const userDTO: CreateUserDto = {
                email: "abc@fakeemail.com",
                password: "Letmein123",
                passwordConfirmation: "Letmein123",
                firstName: "John",
                lastName: "Doe",
                title: "intern",
                organization: "Fake Org",
            };
            usersController.create(userDTO);
            expect(usersService.create).toHaveBeenCalledWith(userDTO);
            expect(usersService.create).toBeCalledTimes(1);
        });

        // Tests the update function
        it("should update", () => {
            const updateUserDTO: UpdateUserDto = {
                email: "updatedemail@yahoo.com",
                firstName: "Jane",
                lastName: "Doe",
                organization: "Fake Org",
                title: "Intern",
                password: "newpassword",
                passwordConfirmation: "newpassword",
                currentPassword: "currentpassword"
            };
            usersController.update(ID, updateUserDTO);
            expect(usersService.update).toHaveBeenCalledWith(ID, updateUserDTO);
            expect(usersService.update).toBeCalledTimes(1);
        });

        // Tests the remove function
        it("should remove", () => {
            const deleteUserDTO : DeleteUserDto = {
                password: "deleteuserdto"
            };
            usersController.remove(ID, deleteUserDTO);
            expect(usersService.remove).toHaveBeenCalledWith(ID, deleteUserDTO);
            expect(usersService.remove).toBeCalledTimes(1);
        });
    });
});