import {
  ForbiddenException,
  HttpStatus,
  INestApplication,
  NotFoundException,
  ValidationPipe
} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import {ValidationError} from 'sequelize';
import {
  CREATE_ADMIN_DTO,
  CREATE_SECOND_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_2,
  CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_PASSWORD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ROLE,
  CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS,
  DELETE_FAILURE_USER_DTO_TEST_OBJ,
  DELETE_USER_DTO_TEST_OBJ,
  DELETE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD,
  ID,
  LOGIN_AUTHENTICATION,
  MINUTE_IN_MILLISECONDS,
  UPDATE_USER_DTO_TEST_OBJ,
  UPDATE_USER_DTO_TEST_OBJ_WITH_MISSMATCHING_PASSWORDS,
  UPDATE_USER_DTO_TEST_WITH_NOT_COMPLEX_PASSWORD,
  UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS,
  UPDATE_USER_DTO_WITH_ADMIN_ROLE,
  UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD,
  UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD
} from '../../test/constants/users-test.constant';
import {
  getUser,
  login,
  register,
  update
} from '../../test/helpers/users.helper';
import {AppModule} from '../app.module';
import {DatabaseService} from '../database/database.service';
import {UserDto} from './dto/user.dto';
import {User} from './user.model';
import {UsersController} from './users.controller';
import {UsersService} from './users.service';

// Test suite for the UsersController
describe('UsersController Unit Tests', () => {
  let app: INestApplication;
  let usersController: UsersController;
  let usersService: UsersService;
  let databaseService: DatabaseService;

  let userDto: UserDto;
  let basicUser: User;
  let adminDto: UserDto;
  let adminUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DatabaseService]
    }).compile();

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    usersController = moduleFixture.get<UsersController>(UsersController);
    usersService = moduleFixture.get<UsersService>(UsersService);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true
      })
    );
    await app.init();
  });

  beforeEach(async () => {
    await databaseService.cleanAll();

    userDto = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
    basicUser = await usersService.findByPkBang(userDto.id);
    adminDto = await usersService.create(CREATE_ADMIN_DTO);
    adminUser = await usersService.findByPkBang(adminDto.id);
  });

  describe('Unauthenticated Functions', () => {
    describe('Create', () => {
      // Tests the create function with valid dto (basic positive test)
      it('should test the create function with valid dto', async () => {
        expect.assertions(9);

        const createdUser = await usersController.create(
          CREATE_USER_DTO_TEST_OBJ_2
        );
        // User should have been created within the last minute
        const timeSinceCreation =
          new Date().getTime() - new Date(createdUser.createdAt).getTime();
        expect(timeSinceCreation).toBeLessThanOrEqual(MINUTE_IN_MILLISECONDS);
        // Actual user fields should match the created user
        expect(createdUser.email).toEqual(CREATE_USER_DTO_TEST_OBJ_2.email);
        expect(createdUser.firstName).toEqual(
          CREATE_USER_DTO_TEST_OBJ_2.firstName
        );
        expect(createdUser.id).toBeDefined();
        expect(createdUser.lastName).toEqual(
          CREATE_USER_DTO_TEST_OBJ_2.lastName
        );
        expect(createdUser.loginCount).toEqual(0);
        expect(createdUser.organization).toEqual(
          CREATE_USER_DTO_TEST_OBJ_2.organization
        );
        expect(createdUser.role).toEqual(CREATE_USER_DTO_TEST_OBJ_2.role);
        expect(createdUser.title).toEqual(CREATE_USER_DTO_TEST_OBJ_2.title);
      });

      // Users shouldn't be able to make accounts with a non-email email field
      it('should test the create function with invalid email field', async () => {
        expect.assertions(1);

        await expect(async () => {
          await usersController.create(
            CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD
          );
        }).rejects.toThrow(ValidationError);
      });

      // Only one account per email should exist
      it('should test the create function with already existing email', async () => {
        expect.assertions(1);

        await register(app, CREATE_USER_DTO_TEST_OBJ);
        return register(app, CREATE_USER_DTO_TEST_OBJ)
          .expect(HttpStatus.INTERNAL_SERVER_ERROR)
          .then((response) => {
            expect(response.body.message).toEqual(['email must be unique']);
          });
      });

      // Tests the create function with dto that is missing email
      it('should test the create function with missing email field', async () => {
        expect.assertions(1);

        await expect(async () => {
          await usersController.create(
            CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD
          );
        }).rejects.toThrow(ValidationError);
      });

      // Tests the create function with dto that is missing password
      it('should test the create function with missing password field', async () => {
        expect.assertions(1);

        return register(
          app,
          CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD
        )
          .expect(HttpStatus.BAD_REQUEST)
          .then((response) => {
            expect(response.body.message).toEqual([
              'password must be a string',
              'password should not be empty'
            ]);
          });
      });

      // Tests the create function with dto that is missing passwordConfirmation
      it('should test the create function with missing password confirmation field', async () => {
        expect.assertions(1);

        return register(
          app,
          CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD
        )
          .expect(HttpStatus.BAD_REQUEST)
          .then((response) => {
            expect(response.body.message).toEqual([
              'passwordConfirmation must be a string',
              'passwordConfirmation should not be empty'
            ]);
          });
      });

      // Users should not be able to create accounts if their passwords do not match
      it('should test the create function with mis-matching passwords', async () => {
        expect.assertions(1);

        return register(app, CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS)
          .expect(HttpStatus.BAD_REQUEST)
          .then((response) => {
            expect(response.body.message).toEqual('Passwords do not match');
          });
      });

      // Users should not be able to create an account if their password does not meet complexity standards
      it('should test the create function with a password that does not meet the complexity requirements', async () => {
        expect.assertions(1);

        return register(app, CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_PASSWORD)
          .expect(HttpStatus.BAD_REQUEST)
          .then((response) => {
            expect(response.body.message).toEqual(
              'Password does not meet complexity requirements. Passwords are a minimum of 15 characters in length. Passwords ' +
                'must contain at least one special character, number, upper-case letter, and lower-case letter. Passwords cannot contain more than three consecutive repeating ' +
                'characters. Passwords cannot contain more than four repeating characters from the same character class.'
            );
          });
      });

      // The role field should be defined as 'user' as currently that's the only account you can sign up as
      it('should return 400 status if no role is provided', async () => {
        expect(async () => {
          await usersController.create(
            CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ROLE
          );
        }).rejects.toThrowError('notNull Violation: User.role cannot be null');
      });
    });
  });

  describe('Authenticated Functions', () => {
    describe('Read', () => {
      // Regular users shouldn't be able to list all users
      it('should test findAll with regular user', async () => {
        expect.assertions(2);

        await expect(async () => {
          await usersController.findAll({user: basicUser});
        }).rejects.toThrow('Cannot execute "read-all" on "User"');
      });

      // Admin users should be able to list all users
      it('should list all users', async () => {
        expect.assertions(1);

        expect(await usersController.findAll({user: adminUser})).toEqual(
          await usersService.findAll()
        );
      });

      // Tests the findById function with valid ID (basic positive test)
      // Users should be able to read their own profile
      it('should test findById with valid ID', async () => {
        expect.assertions(1);

        expect(
          await usersController.findById(basicUser.id, {user: basicUser})
        ).toEqual(new UserDto(await usersService.findById(basicUser.id)));
      });

      // Tests the findById function with ID that is 'not found'
      it('should test findById with invalid ID', async () => {
        expect.assertions(1);

        await expect(async () => {
          await usersController.findById(ID, {user: basicUser});
        }).rejects.toThrow(NotFoundException);
      });

      // Invalid users shouldn't be able to read other users
      it('should test findById function with invalid token', async () => {
        await getUser(app, basicUser.id, 'badtoken')
          .expect(HttpStatus.UNAUTHORIZED)
          .then((response) => {
            expect(response.body.message).toEqual('Unauthorized');
          });
      });
    });
    describe('Update', () => {
      // Tests the update function with valid dto (basic positive test)
      it('should test the update function with a valid update dto', async () => {
        expect.assertions(6);

        const updatedUser = await usersController.update(
          basicUser.id,
          {user: basicUser},
          UPDATE_USER_DTO_TEST_OBJ
        );
        // Should be the same user
        expect(updatedUser.id).toEqual(basicUser.id);
        // User fields should be updated
        expect(updatedUser.firstName).toEqual(
          UPDATE_USER_DTO_TEST_OBJ.firstName
        );
        expect(updatedUser.lastName).toEqual(UPDATE_USER_DTO_TEST_OBJ.lastName);
        expect(updatedUser.organization).toEqual(
          UPDATE_USER_DTO_TEST_OBJ.organization
        );
        expect(updatedUser.title).toEqual(UPDATE_USER_DTO_TEST_OBJ.title);
        expect(updatedUser.role).toEqual(UPDATE_USER_DTO_TEST_OBJ.role);
      });

      // Users can update their profiles without specifying a new password
      it('should test the update function with a valid update dto that does not change the users password', async () => {
        expect.assertions(6);
        const updatedUser = await usersController.update(
          basicUser.id,
          {user: basicUser},
          UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS
        );
        // Should be the same user
        expect(updatedUser.id).toEqual(basicUser.id);
        // User fields should be updated
        expect(updatedUser.firstName).toEqual(
          UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.firstName
        );
        expect(updatedUser.lastName).toEqual(
          UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.lastName
        );
        expect(updatedUser.organization).toEqual(
          UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.organization
        );
        expect(updatedUser.title).toEqual(
          UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.title
        );
        expect(updatedUser.role).toEqual(
          UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.role
        );
      });

      // Tests the update function with ID that is 'not found'
      it('should test update function with invalid ID', async () => {
        expect.assertions(1);

        await expect(async () => {
          await usersController.update(
            ID,
            {user: basicUser},
            UPDATE_USER_DTO_TEST_OBJ
          );
        }).rejects.toThrow(NotFoundException);
      });

      // Tests the update function with dto that has mis-matching password and passwordConfirmation
      it('should test the update function with a valid new password an mis-matching password confirmation', async () => {
        expect.assertions(2);

        await login(app, LOGIN_AUTHENTICATION)
          .expect(HttpStatus.CREATED)
          .then(async (loginResponse) => {
            return update(
              app,
              basicUser.id,
              UPDATE_USER_DTO_TEST_OBJ_WITH_MISSMATCHING_PASSWORDS,
              loginResponse.body.accessToken
            )
              .expect(HttpStatus.BAD_REQUEST)
              .then((updateResponse) => {
                expect(updateResponse.body.message).toEqual(
                  'Passwords do not match'
                );
                expect(updateResponse.body.error).toEqual('Bad Request');
              });
          });
      });

      // Tests the update function with dto that is missing currentPassword
      it('should test the update function with a dto that is missing currentPassword field', async () => {
        expect.assertions(1);

        await expect(async () => {
          await usersController.update(
            basicUser.id,
            {user: basicUser},
            UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD
          );
        }).rejects.toThrow(ForbiddenException);
      });

      // Tests the update function with an incorrect password
      it('should test the update function with a dto that has an invalid currentPassword field', async () => {
        expect.assertions(1);

        await expect(async () => {
          await usersController.update(
            basicUser.id,
            {user: basicUser},
            UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD
          );
        }).rejects.toThrow(ForbiddenException);
      });

      // Tests the update function with a passsword that doesn't meet complexity requirements
      // This has to be an e2e test as directly calling the function doesn't trigger the password complexity pipe
      it('should test the update function with a dto that has a new password that does not meet complexity requirements', async () => {
        expect.assertions(2);

        await login(app, LOGIN_AUTHENTICATION)
          .expect(HttpStatus.CREATED)
          .then(async (loginResponse) => {
            return update(
              app,
              basicUser.id,
              UPDATE_USER_DTO_TEST_WITH_NOT_COMPLEX_PASSWORD,
              loginResponse.body.accessToken
            )
              .expect(HttpStatus.BAD_REQUEST)
              .then((response) => {
                expect(response.body.message).toEqual(
                  'Password does not meet complexity requirements. Passwords are a minimum of 15 characters in length. Passwords ' +
                    'must contain at least one special character, number, upper-case letter, and lower-case letter. Passwords cannot contain more than three consecutive repeating ' +
                    'characters. Passwords cannot contain more than four repeating characters from the same character class.'
                );
                expect(response.body.error).toEqual('Bad Request');
              });
          });
      });

      // Users should not be able to update their role
      it('should test the update function when a regular user chooses an admin role', async () => {
        expect.assertions(1);

        await usersController.update(
          basicUser.id,
          {user: basicUser},
          UPDATE_USER_DTO_WITH_ADMIN_ROLE
        );
        expect(basicUser.role).toEqual('user');
      });

      // Admins should be able to update any user besides themselves without providing the current password
      it('should test the update function as an admin user for another user and a dto missing current password field', async () => {
        expect.assertions(6);
        const updatedUser = await usersController.update(
          basicUser.id,
          {user: adminUser},
          UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD
        );
        // They should be the same user
        expect(updatedUser.id).toEqual(basicUser.id);
        // The user should be updated
        expect(updatedUser.firstName).toEqual(
          UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD.firstName
        );
        expect(updatedUser.lastName).toEqual(
          UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD.lastName
        );
        expect(updatedUser.organization).toEqual(
          UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD.organization
        );
        expect(updatedUser.title).toEqual(
          UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD.title
        );
        expect(updatedUser.role).toEqual(
          UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD.role
        );
      });

      // Admins should not be able to update their user without providing their current password
      it('should test the update function with an admin user and a dto missing current password field for their own user', async () => {
        expect.assertions(1);
        try {
          await usersController.update(
            adminUser.id,
            {user: adminUser},
            UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD
          );
        } catch (error) {
          expect(error).toBeInstanceOf(ForbiddenException);
        }
      });

      // Admins should be able to promote regular users to administrators
      it('should test the update function with an admin user and a dto with a role of admin for another user', async () => {
        expect.assertions(1);
        const updatedUser = await usersController.update(
          basicUser.id,
          {user: adminUser},
          UPDATE_USER_DTO_WITH_ADMIN_ROLE
        );
        expect(updatedUser.role).toEqual('admin');
      });
    });

    describe('Remove', () => {
      it('should remove', async () => {
        expect.assertions(1);

        expect(
          await usersController.remove(
            basicUser.id,
            {user: basicUser},
            DELETE_USER_DTO_TEST_OBJ
          )
        ).toEqual(new UserDto(basicUser));
      });

      // Tests the remove function with ID that is 'not found'
      it('should test remove function with invalid ID', async () => {
        expect.assertions(1);

        await expect(async () => {
          await usersController.remove(
            ID,
            {user: adminUser},
            DELETE_USER_DTO_TEST_OBJ
          );
        }).rejects.toThrow(NotFoundException);
      });

      // Tests the remove function with an incorrect password
      it('should test remove function with a dto that has an incorrect password field', async () => {
        expect.assertions(1);

        await expect(async () => {
          await usersController.remove(
            basicUser.id,
            {user: basicUser},
            DELETE_FAILURE_USER_DTO_TEST_OBJ
          );
        }).rejects.toThrow(ForbiddenException);
      });

      // Tests the remove function with dto that is missing password
      it('should test remove function with a dto that is missing password field', async () => {
        expect.assertions(1);

        await expect(async () => {
          await usersController.remove(
            basicUser.id,
            {user: basicUser},
            DELETE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD
          );
        }).rejects.toThrow(ForbiddenException);
      });

      // Admins should be able to remove other users without their password
      it('should test remove function with admin user and a dto that has no password', async () => {
        expect(
          await usersController.remove(basicUser.id, {user: adminUser}, {})
        ).toEqual(new UserDto(basicUser));
      });

      // Admins should not be able to remove their account if they are the only administrator
      it('should test remove function with admin user that is the only admin', async () => {
        expect.assertions(1);

        await expect(async () => {
          await usersController.remove(
            adminUser.id,
            {user: adminUser},
            DELETE_USER_DTO_TEST_OBJ
          );
        }).rejects.toThrow(ForbiddenException);
      });

      // Admins should be able to remove their account if there is another administrator
      it('should test remove function with admin user and there is another admin', async () => {
        expect.assertions(1);
        // Create a second user so we can delete the first
        const newAdminDto = await usersController.create(
          CREATE_SECOND_ADMIN_DTO
        );
        const newAdmin = await usersService.findByPkBang(newAdminDto.id);
        // Delete the existing user
        await usersController.remove(
          adminUser.id,
          {user: adminUser},
          DELETE_USER_DTO_TEST_OBJ
        );
        // Make sure the existing admin has been deleted
        await expect(async () => {
          await usersController.findById(adminUser.id, {user: newAdmin});
        }).rejects.toThrow(NotFoundException);
      });
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });
});
