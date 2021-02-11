import {HttpStatus, INestApplication, ValidationPipe} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import request from 'supertest';
import {AppModule} from '../src/app.module';
import {DatabaseService} from '../src/database/database.service';
import {UsersService} from '../src/users/users.service';
import {
  ADMIN_LOGIN_AUTHENTICATION,
  CREATE_ADMIN_DTO,
  CREATE_SECOND_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ,
  DELETE_FAILURE_USER_DTO_TEST_OBJ,
  DELETE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION,
  MINUTE_IN_MILLISECONDS,
  UPDATE_USER_DTO_TEST_OBJ_WITH_MISSMATCHING_PASSWORDS,
  UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD,
  UPDATE_USER_DTO_TEST_WITH_NOT_COMPLEX_PASSWORD,
  UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS,
  UPDATE_USER_DTO_WITH_ADMIN_ROLE,
  UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD,
  UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD
} from './constants/users-test.constant';
import {destroy, login, register, update} from './helpers/users.helper';

describe('/users', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DatabaseService]
    }).compile();

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
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

  describe('Functions that require authentication', () => {
    let id: string;
    let jwtToken: string;

    // Clear the database and retrieve access token
    beforeEach(async () => {
      await databaseService.cleanAll();
      await register(app, CREATE_USER_DTO_TEST_OBJ)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          id = response.body.id;
        });

      await login(app, LOGIN_AUTHENTICATION)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          jwtToken = response.body.accessToken;
        });
    });

    describe('Read', () => {
      it('should return a 403 status when a non-admin tries to list all users', async () => {
        return request(app.getHttpServer())
          .get('/users')
          .set('Authorization', 'bearer ' + jwtToken)
          .expect(HttpStatus.FORBIDDEN)
          .then((response) => {
            expect(response.body.message).toEqual(
              'Cannot execute "read-all" on "User"'
            );
          });
      });

      it('should return 200 status when user is returned', async () => {
        return request(app.getHttpServer())
          .get('/users/' + id)
          .set('Authorization', 'bearer ' + jwtToken)
          .expect(HttpStatus.OK)
          .then((response) => {
            const createdAt = response.body.createdAt.valueOf();
            const updatedAt = response.body.updatedAt.valueOf();
            // User should have been created within the last minuted
            const createdWithinOneMinute =
              new Date().getTime() - new Date(createdAt).getTime();
            // User should have been updated within the last minuted
            const updatedWithinOneMinute =
              new Date().getTime() - new Date(updatedAt).getTime();

            expect(createdWithinOneMinute).toBeLessThanOrEqual(
              MINUTE_IN_MILLISECONDS
            );
            expect(response.body.email).toEqual(CREATE_USER_DTO_TEST_OBJ.email);
            expect(response.body.firstName).toEqual(
              CREATE_USER_DTO_TEST_OBJ.firstName
            );
            expect(response.body.id).toEqual(id);
            expect(response.body.lastName).toEqual(
              CREATE_USER_DTO_TEST_OBJ.lastName
            );
            expect(response.body.lastLogin).toBeDefined();
            expect(response.body.loginCount).toEqual(1);
            expect(response.body.organization).toEqual(
              CREATE_USER_DTO_TEST_OBJ.organization
            );
            expect(response.body.role).toEqual(CREATE_USER_DTO_TEST_OBJ.role);
            expect(response.body.title).toEqual(CREATE_USER_DTO_TEST_OBJ.title);
            expect(updatedWithinOneMinute).toBeLessThanOrEqual(
              MINUTE_IN_MILLISECONDS
            );
          });
      });

      it('should return 400 status if given invalid token', async () => {
        const invalidID = -1;
        return request(app.getHttpServer())
          .get('/users/' + invalidID)
          .set('Authorization', 'bearer ' + 'badtoken')
          .expect(HttpStatus.UNAUTHORIZED)
          .then((response) => {
            expect(response.body.message).toEqual('Unauthorized');
          });
      });
    });

    describe('Update', () => {
      it('should return 200 status when user is updated', async () => {
        return update(
          app,
          id,
          UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD,
          jwtToken
        )
          .expect(HttpStatus.OK)
          .then((response) => {
            expect(response.body.email).toEqual(
              UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.email
            );
            expect(response.body.firstName).toEqual(
              UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.firstName
            );
            expect(response.body.id).toEqual(id);
            expect(response.body.lastName).toEqual(
              UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.lastName
            );
            expect(response.body.organization).toEqual(
              UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.organization
            );
            expect(response.body.title).toEqual(
              UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.title
            );
            expect(response.body.role).toEqual(
              UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.role
            );
          });
      });

      it('should return 200 status when user is updated without changing password', async () => {
        return update(
          app,
          id,
          UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS,
          jwtToken
        )
          .expect(HttpStatus.OK)
          .then((response) => {
            expect(response.body.email).toEqual(
              UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.email
            );
            expect(response.body.firstName).toEqual(
              UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.firstName
            );
            expect(response.body.id).toEqual(id);
            expect(response.body.lastName).toEqual(
              UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.lastName
            );
            expect(response.body.organization).toEqual(
              UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.organization
            );
            expect(response.body.title).toEqual(
              UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.title
            );
            expect(response.body.role).toEqual(
              UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.role
            );
          });
      });

      it('should return 400 status when currentPassword is empty', async () => {
        return update(
          app,
          id,
          UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD,
          jwtToken
        )
          .expect(HttpStatus.FORBIDDEN)
          .then((response) => {
            expect(response.body.message).toEqual(
              'Current password is incorrect'
            );
            expect(response.body.error).toEqual('Forbidden');
          });
      });

      it('should not allow a user to change their role', async () => {
        return update(app, id, UPDATE_USER_DTO_WITH_ADMIN_ROLE, jwtToken)
          .expect(HttpStatus.OK)
          .then((response) => {
            expect(response.body.role).toEqual('user');
          });
      });

      it('should return 403 status when currentPassword is wrong', async () => {
        return update(
          app,
          id,
          UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD,
          jwtToken
        ).expect(HttpStatus.FORBIDDEN);
      });

      it('should return 400 status when password does not meet complexity requirements', async () => {
        return update(
          app,
          id,
          UPDATE_USER_DTO_TEST_WITH_NOT_COMPLEX_PASSWORD,
          jwtToken
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

      it("should return 400 status when password and passwordConfirmation don't match", async () => {
        return update(
          app,
          id,
          UPDATE_USER_DTO_TEST_OBJ_WITH_MISSMATCHING_PASSWORDS,
          jwtToken
        )
          .expect(HttpStatus.BAD_REQUEST)
          .then((response) => {
            expect(response.body.message).toEqual('Passwords do not match');
            expect(response.body.error).toEqual('Bad Request');
          });
      });
    });

    describe('Destroy', () => {
      it('should return 200 status after user is deleted', async () => {
        return destroy(app, id, DELETE_USER_DTO_TEST_OBJ, jwtToken)
          .expect(HttpStatus.OK)
          .then((response) => {
            const createdAt = response.body.createdAt.valueOf();
            const updatedAt = response.body.updatedAt.valueOf();
            // User should have been created within the last minuted
            const createdWithinOneMinute =
              new Date().getTime() - new Date(createdAt).getTime();
            // User should have been updated within the last minuted
            const updatedWithinOneMinute =
              new Date().getTime() - new Date(updatedAt).getTime();

            expect(createdWithinOneMinute).toBeLessThanOrEqual(
              MINUTE_IN_MILLISECONDS
            );
            expect(response.body.email).toEqual(CREATE_USER_DTO_TEST_OBJ.email);
            expect(response.body.firstName).toEqual(
              CREATE_USER_DTO_TEST_OBJ.firstName
            );
            expect(response.body.id).toEqual(id);
            expect(response.body.lastName).toEqual(
              CREATE_USER_DTO_TEST_OBJ.lastName
            );
            expect(response.body.loginCount).toEqual(1);
            expect(response.body.organization).toEqual(
              CREATE_USER_DTO_TEST_OBJ.organization
            );
            expect(response.body.role).toEqual(CREATE_USER_DTO_TEST_OBJ.role);
            expect(response.body.title).toEqual(CREATE_USER_DTO_TEST_OBJ.title);
            expect(updatedWithinOneMinute).toBeLessThanOrEqual(
              MINUTE_IN_MILLISECONDS
            );
          });
      });

      it('should return 403 status because password is wrong', async () => {
        return destroy(
          app,
          id,
          DELETE_FAILURE_USER_DTO_TEST_OBJ,
          jwtToken
        ).expect(HttpStatus.FORBIDDEN);
      });

      it('should return 200 status after user is deleted by admin', async () => {
        function EmptyJWTError(): string {
          return 'Token does not conform to the expected format for a zip code';
        }
        const admin = await usersService.create(CREATE_ADMIN_DTO);
        // Create a second admin so that the first is one allowed to be deleted
        await usersService.create(CREATE_SECOND_ADMIN_DTO);

        let adminJWTToken = '';
        await request(app.getHttpServer())
          .post('/authn/login')
          .set('Content-Type', 'application/json')
          .send(ADMIN_LOGIN_AUTHENTICATION)
          .expect(HttpStatus.CREATED)
          .then((response) => {
            adminJWTToken = response.body.accessToken;
          });

        if (adminJWTToken === '') {
          throw EmptyJWTError();
        }

        await request(app.getHttpServer())
          .delete('/users/' + admin.id)
          .set('Authorization', 'bearer ' + adminJWTToken)
          .send(DELETE_USER_DTO_TEST_OBJ)
          .expect(HttpStatus.OK)
          .then((response) => {
            const createdAt = response.body.createdAt.valueOf();
            const updatedAt = response.body.updatedAt.valueOf();
            // User should have been created within the last minute
            const createdWithinOneMinute =
              new Date().getTime() - new Date(createdAt).getTime();
            // User should have been updated within the last minute
            const updatedWithinOneMinute =
              new Date().getTime() - new Date(updatedAt).getTime();

            expect(createdWithinOneMinute).toBeLessThanOrEqual(
              MINUTE_IN_MILLISECONDS
            );
            expect(response.body.email).toEqual(CREATE_ADMIN_DTO.email);
            expect(response.body.firstName).toEqual(CREATE_ADMIN_DTO.firstName);
            expect(response.body.id).toEqual(admin.id);
            expect(response.body.lastName).toEqual(CREATE_ADMIN_DTO.lastName);
            expect(response.body.loginCount).toEqual(1);
            expect(response.body.organization).toEqual(
              CREATE_ADMIN_DTO.organization
            );
            expect(response.body.role).toEqual(CREATE_ADMIN_DTO.role);
            expect(response.body.title).toEqual(CREATE_ADMIN_DTO.title);
            expect(updatedWithinOneMinute).toBeLessThanOrEqual(
              MINUTE_IN_MILLISECONDS
            );
          });

        return request(app.getHttpServer())
          .get('/users/' + admin.id)
          .set('Authorization', 'bearer ' + adminJWTToken)
          .expect(HttpStatus.NOT_FOUND)
          .then((response) => {
            expect(response.body.message).toEqual(
              'User with given id not found'
            );
            expect(response.body.error).toEqual('Not Found');
          });
      });
    });
  });

  describe('Functions that require admin authentication', () => {
    let jwtToken: string;
    let editUserId: string;
    let adminUserId: string;

    // Clear the database and retrieve access token
    beforeEach(async () => {
      await databaseService.cleanAll();
      await usersService.create(CREATE_ADMIN_DTO).then((user) => {
        adminUserId = user.id;
      });

      await login(app, ADMIN_LOGIN_AUTHENTICATION)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          jwtToken = response.body.accessToken;
        });

      // This creates the user that the next tests will update
      await register(app, CREATE_USER_DTO_TEST_OBJ)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          editUserId = response.body.id;
        });
    });

    it('should return a 200 status when an admin tries to list all users', async () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'bearer ' + jwtToken)
        .expect(HttpStatus.OK);
    });

    describe('Admin Update', () => {
      it('should be able to update a user without providing the current password', async () => {
        return update(
          app,
          editUserId,
          UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD,
          jwtToken
        )
          .expect(HttpStatus.OK)
          .then((response) => {
            expect(response.body.email).toEqual(
              UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD.email
            );
            expect(response.body.firstName).toEqual(
              UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD.firstName
            );
            expect(response.body.id).toEqual(editUserId);
            expect(response.body.lastName).toEqual(
              UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD.lastName
            );
            expect(response.body.organization).toEqual(
              UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD.organization
            );
            expect(response.body.title).toEqual(
              UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD.title
            );
            expect(response.body.role).toEqual(
              UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD.role
            );
          });
      });

      it('should not be able to update themselves without providing the current password', async () => {
        return update(
          app,
          adminUserId,
          UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD,
          jwtToken
        ).expect(HttpStatus.FORBIDDEN);
      });

      it('should be able to update a user role', async () => {
        return update(
          app,
          editUserId,
          UPDATE_USER_DTO_WITH_ADMIN_ROLE,
          jwtToken
        )
          .expect(HttpStatus.OK)
          .then((response) => {
            expect(response.body.role).toEqual('admin');
          });
      });
    });

    describe('Admin destroy', async () => {
      it('should be able to destroy a user without a password', async () => {
        return destroy(app, editUserId, {}, jwtToken).expect(HttpStatus.OK);
      });

      it('should not be able to destroy the only administrator', async () => {
        return destroy(app, adminUserId, DELETE_USER_DTO_TEST_OBJ, jwtToken)
          .expect(HttpStatus.FORBIDDEN)
          .then((response) => {
            expect(response.body.message).toEqual(
              'Cannot destroy only administrator account, please promote another user to administrator first'
            );
          });
      });
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await app.close();
    await databaseService.closeConnection();
  });
});
