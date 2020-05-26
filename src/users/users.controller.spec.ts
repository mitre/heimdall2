import { Test, TestingModule } from '@nestjs/testing';
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> c00e275... Added first unit test for users controller
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.model';
import { UserDto } from './dto/user.dto';
import { CreateUserDto } from './dto/create-user.dto';
<<<<<<< HEAD
=======
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { UsersModule } from '../../src/users/users.module';
import { User } from '../../src/users/user.model';
import { UserDto } from '../../src/users/dto/user.dto';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
>>>>>>> 2a8b421... Update
=======
>>>>>>> c00e275... Added first unit test for users controller
import { async } from 'rxjs/internal/scheduler/async';

// Test suite for the UsersController
describe("UsersController", () => {
    let usersController: UsersController;
    let usersService: UsersService;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [UsersController],
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> c00e275... Added first unit test for users controller
            providers: [
                {
                    provide: UsersService,
                    useFactory: () => ({
                        create: jest.fn(() => true),
                    })
                }
            ],
<<<<<<< HEAD
        }).compile();
=======
            providers: [UsersService],
        }).compile();

>>>>>>> 2a8b421... Update
=======
        }).compile();
>>>>>>> c00e275... Added first unit test for users controller
        usersService = module.get<UsersService>(UsersService);
        usersController = module.get<UsersController>(UsersController);
    });

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> c00e275... Added first unit test for users controller
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
<<<<<<< HEAD

        it("should find by ID", () => {
            
        });
    });
=======
    it("should work", () => {
        expect(5).toBe(5);
    })

    // // Test suite for findByID
    // describe("findById", () => {
    //     it("should ", async () => {
    //         const user = new User();
    //         user.id = 0;

    //         jest.spyOn(usersService, "findById").mockResolvedValue(new UserDto(user));
    //         expect(await usersController.findById(0)).toBe(0);
    //     });
    // });
>>>>>>> 2a8b421... Update
=======

        it("should find by ID", () => {
            
        });
    });
>>>>>>> c00e275... Added first unit test for users controller
});