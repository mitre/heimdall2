import { NotFoundException, BadRequestException, CanActivate } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
<<<<<<< HEAD
import {
  ID,
  USER_ONE_DTO,
  UPDATED_USER_DTO,
  CREATE_USER_DTO_TEST_OBJ,
  DELETE_USER_DTO_TEST_OBJ,
  UPDATE_USER_DTO_TEST_OBJ,
  DELETE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD,
  UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD,
} from '../../test/test.constants';
import { AbacGuard } from '../guards/abac.guard';
=======
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
>>>>>>> 49f931e... Finished UsersController unit tests

// Test suite for the UsersController
<<<<<<< HEAD
describe('UsersController Unit Tests', () => {
  const mockAbacGuard: CanActivate = { canActivate: jest.fn(() => true)};
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
            // These mock functions are used for the basic 'positive' tests
            create: jest.fn(() => USER_ONE_DTO),
            findById: jest.fn(() => USER_ONE_DTO),
            update: jest.fn(() => UPDATED_USER_DTO),
            remove: jest.fn(() => USER_ONE_DTO)
          })
        },
      ],
    }).overrideGuard(AbacGuard).useValue(mockAbacGuard).compile();

    usersService = module.get<UsersService>(UsersService);
    usersController = module.get<UsersController>(UsersController);
  });

  describe('FindbyId function', () => {
    // Tests the findById function with valid ID (basic positive test)
    it('should test findById with valid ID', async () => {
      expect(await usersController.findById(ID)).toBe(USER_ONE_DTO);
      expect(usersService.findById).toHaveReturnedWith(USER_ONE_DTO);
    });

    // Tests the findById function with ID that is 'not found'
    it('should test findById with invalid ID', async () => {
      jest.spyOn(usersService, 'findById').mockImplementation(() => {
        throw new NotFoundException();
      });
      expect(async () => {
        await usersController.findById(ID);
      }).rejects.toThrow(NotFoundException);
    });
  });

  describe('Create function', () => {
    // Tests the create function with valid dto (basic positive test)
    it('should test the create function with valid dto', async () => {
      expect(await usersController.create(CREATE_USER_DTO_TEST_OBJ)).toEqual(USER_ONE_DTO);
      expect(usersService.create).toHaveReturnedWith(USER_ONE_DTO);
    });

    // Tests the create function with dto that is missing email
    it('should test the create function with missing email field', async () => {
      jest.spyOn(usersService, 'create').mockImplementation(() => {
        throw new BadRequestException();
      });
      expect(async () => {
        await usersController.create(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD);
      }).rejects.toThrow(BadRequestException);
    });

    // Tests the create function with dto that is missing password
    it('should test the create function with missing password field', async () => {
      jest.spyOn(usersService, 'create').mockImplementation(() => {
        throw new BadRequestException();
      });
      expect(async () => {
        await usersController.create(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD);
      }).rejects.toThrow(BadRequestException);
    });

    // Tests the create function with dto that is missing passwordConfirmation
    it('should test the create function with missing password confirmation field', async () => {
      jest.spyOn(usersService, 'create').mockImplementation(() => {
        throw new BadRequestException();
      });
      expect(async () => {
        await usersController.create(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD);
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe('Update function', () => {
    // Tests the update function with valid dto (basic positive test)
    it('should test the update function with a valid update dto', async () => {
      expect(await usersController.update(ID, UPDATE_USER_DTO_TEST_OBJ)).toEqual(UPDATED_USER_DTO);
      expect(usersService.update).toHaveReturnedWith(UPDATED_USER_DTO);
    });

    // Tests the update function with ID that is 'not found'
    it('should test update function with invalid ID', async () => {
      jest.spyOn(usersService, 'update').mockImplementation(() => {
        throw new NotFoundException();
      });
      expect(async () => {
        await usersController.update(ID, UPDATE_USER_DTO_TEST_OBJ);
      }).rejects.toThrow(NotFoundException);
    });

    // Tests the update function with dto that is missing currentPassword
    it('should test the update function with a dto that is missing currentPassword field', async () => {
      jest.spyOn(usersService, 'update').mockImplementation(() => {
        throw new BadRequestException();
      });
      expect(async () => {
        await usersController.update(ID, UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD);
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe('Remove function', () => {
    // Tests the remove function with valid dto (basic positive test)
    it('should remove', async () => {
      expect(await usersController.remove(ID, DELETE_USER_DTO_TEST_OBJ)).toEqual(USER_ONE_DTO);
      expect(usersService.remove).toHaveReturnedWith(USER_ONE_DTO);
    });

    // Tests the remove function with ID that is 'not found'
    it('should test remove function with invalid ID', async () => {
      jest.spyOn(usersService, 'remove').mockImplementation(() => {
        throw new NotFoundException();
      });
      expect(async () => {
        await usersController.remove(ID, DELETE_USER_DTO_TEST_OBJ);
      }).rejects.toThrow(NotFoundException);
    });

    // Tests the remove function with dto that is missing password
    it('should test remove function with a dto that is missing password field', async () => {
      jest.spyOn(usersService, 'remove').mockImplementation(() => {
        throw new BadRequestException();
      });
      expect(async () => {
        await usersController.remove(ID, DELETE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD);
      }).rejects.toThrow(BadRequestException);
    });
  });
});
=======
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
>>>>>>> 28adb4d... More unit tests
