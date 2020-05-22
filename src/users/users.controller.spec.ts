import { Test, TestingModule } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { UsersModule } from '../../src/users/users.module';
import { User } from '../../src/users/user.model';
import { UserDto } from '../../src/users/dto/user.dto';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { async } from 'rxjs/internal/scheduler/async';

// Test suite for the UsersController
describe("UsersController", () => {
    let usersController: UsersController;
    let usersService: UsersService;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [UsersService],
        }).compile();

        usersService = module.get<UsersService>(UsersService);
        usersController = module.get<UsersController>(UsersController);
    });

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
});