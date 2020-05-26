import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.model';
import { UserDto } from './dto/user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { async } from 'rxjs/internal/scheduler/async';

// Test suite for the UsersController
describe("UsersController", () => {
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
                        create: jest.fn(),
                        findByID: jest.fn(),
                    })
                }
            ],
        }).compile();
        usersService = module.get<UsersService>(UsersService);
        usersController = module.get<UsersController>(UsersController);
    });

    // Test suite for findByID
    describe("UsersController", () => {
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
        });

        it("should find by ID", () => {
            
        });
    });
});