import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import * as consts from '../test.constants';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

// Test suite for the UsersController
describe('UsersController Unit Tests', () => {
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
                        create: jest.fn(() => consts.USER_ONE_DTO),
                        findById: jest.fn(() => consts.USER_ONE_DTO),
                        update: jest.fn(() => consts.UPDATED_USER_DTO),
                        remove: jest.fn(() => consts.USER_ONE_DTO)
                    })
                }
            ],
        }).compile();

        usersService = module.get<UsersService>(UsersService);
        usersController = module.get<UsersController>(UsersController);
    });

    describe('FindbyId function', () => {
        // Tests the findById function with valid ID (basic positive test)
        it('should test findById with valid ID', async () => {
            expect(await usersController.findById(consts.ID)).toBe(consts.USER_ONE_DTO);
            expect(usersService.findById).toHaveReturnedWith(consts.USER_ONE_DTO);
        });

        // Tests the findById function with ID that is 'not found'
        it('should test findById with invalid ID', async () => {
            jest.spyOn(usersService, 'findById').mockImplementation(() => {
                throw new NotFoundException('User with given id not found');
            });
            expect(async () => {
              await usersController.findById(consts.ID);
            }).rejects.toThrowError('User with given id not found');
        });
    });

    describe('Create function', () => {
        // Tests the create function with valid dto (basic positive test)
        it('should test the create function with valid dto', async () => {
            expect(await usersController.create(consts.CREATE_USER_DTO_TEST_OBJ)).toEqual(consts.USER_ONE_DTO);
            expect(usersService.create).toHaveReturnedWith(consts.USER_ONE_DTO);
        });

        // Tests the create function with dto that is missing email
        it('should test the create function with missing email field', async () => {
            jest.spyOn(usersService, 'create').mockImplementation(() => {
                throw new Error('User.email cannot be null');
            });
            expect(async () => {
              await usersController.create(consts.CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD);
            }).rejects.toThrowError('User.email cannot be null');
        });

        // Tests the create function with dto that is missing password
        it('should test the create function with missing password field', async () => {
            jest.spyOn(usersService, 'create').mockImplementation(() => {
                throw new UnauthorizedException('data and salt arguments required');
            });
            expect(async () => {
              await usersController.create(consts.CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD);
            }).rejects.toThrowError('data and salt arguments required');
        });

        // Tests the create function with dto that is missing passwordConfirmation
        it('should test the create function with missing password confirmation field', async () => {
            jest.spyOn(usersService, 'create').mockImplementation(() => {
                throw new UnauthorizedException('data and salt arguments required');
            });
            expect(async () => {
              await usersController.create(consts.CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD);
            }).rejects.toThrowError('data and salt arguments required');
        });
    });

    describe('Update function', () => {
        // Tests the update function with valid dto (basic positive test)
        it('should test the update function with a valid update dto', async () => {
            expect(await usersController.update(consts.ID, consts.UPDATE_USER_DTO_TEST_OBJ)).toEqual(consts.UPDATED_USER_DTO);
            expect(usersService.update).toHaveReturnedWith(consts.UPDATED_USER_DTO);
        });

        // Tests the update function with ID that is 'not found'
        it('should test update function with invalid ID', async () => {
            jest.spyOn(usersService, 'update').mockImplementation(() => {
                throw new NotFoundException('User with given id not found');
            });
            expect(async () => {
              await usersController.update(consts.ID, consts.UPDATE_USER_DTO_TEST_OBJ);
            }).rejects.toThrowError('User with given id not found');
        });

        // Tests the update function with dto that is missing currentPassword
        it('should test the update function with a dto that is missing currentPassword field', async () => {
            jest.spyOn(usersService, 'update').mockImplementation(() => {
                throw new UnauthorizedException('data and salt arguments required');
            });
            expect(async () => {
              await usersController.update(consts.ID, consts.UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD);
            }).rejects.toThrowError('data and salt arguments required');
        });
    });

    describe('Remove function', () => {
        // Tests the remove function with valid dto (basic positive test)
        it('should remove', async () => {
            expect(await usersController.remove(consts.ID, consts.DELETE_USER_DTO_TEST_OBJ)).toEqual(consts.USER_ONE_DTO);
            expect(usersService.remove).toHaveReturnedWith(consts.USER_ONE_DTO);
        });

        // Tests the remove function with ID that is 'not found'
        it('should test remove function with invalid ID', async () => {
            jest.spyOn(usersService, 'remove').mockImplementation(() => {
                throw new NotFoundException('User with given id not found');
            });
            expect(async () => {
              await usersController.remove(consts.ID, consts.DELETE_USER_DTO_TEST_OBJ);
            }).rejects.toThrowError('User with given id not found');
        });

        // Tests the remove function with dto that is missing password
        it('should test remove function with a dto that is missing password field', async () => {
            jest.spyOn(usersService, 'remove').mockImplementation(() => {
                throw new UnauthorizedException('data and salt arguments required');
            });
            expect(async () => {
              await usersController.remove(consts.ID, consts.DELETE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD);
            }).rejects.toThrowError('data and salt arguments required');
        });
    });
});
