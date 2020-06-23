import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { DatabaseService } from './../src/database/database.service';
import { CREATE_USER_DTO_TEST_OBJ, 
  CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS, 
  TEST_USER, CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD, 
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD, 
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD, 
  LOGIN_AUTHENTICATION, UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD, 
  UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD, 
  UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD, 
  DELETE_USER_DTO_TEST_OBJ, 
  DELETE_FAILURE_USER_DTO_TEST_OBJ, 
  CREATE_USER_DTO_ADMIN,
  ADMIN,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ROLE
} from './test.constants';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DatabaseService]
    }).compile();

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);

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
  });

  describe('/users', () => {

    describe('POST', () => {
      it('should return 201 status when user is created', async () => {
        return await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ).expect(HttpStatus.CREATED).then(response => {
          expect(response.body.createdAt.valueOf()).not.toBe(TEST_USER.createdAt.valueOf());
          expect(response.body.email).toEqual(TEST_USER.email);
          expect(response.body.firstName).toEqual(TEST_USER.firstName);
          expect(response.body.id).toBeDefined();
          expect(response.body.lastLogin).toEqual(null);
          expect(response.body.lastName).toEqual(TEST_USER.lastName);
          expect(response.body.loginCount).toEqual(TEST_USER.loginCount.toString());
          expect(response.body.organization).toEqual(TEST_USER.organization);
          expect(response.body.role).toEqual(TEST_USER.role);
          expect(response.body.title).toEqual(TEST_USER.title);
          expect(response.body.updatedAt.valueOf()).not.toBe(TEST_USER.updatedAt.valueOf());
        });
      });

      it('should return 400 status if passwords dont match', async () => {
        return await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS)
          .expect(HttpStatus.BAD_REQUEST).then(response => {
            expect(response.body.message).toEqual('Passwords do not match');
            expect(response.body.error).toEqual('Bad Request');
          });
      });

      it('should return 400 status if password is not provided', async () => {
        return await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD)
          .expect(HttpStatus.BAD_REQUEST).then(response => {
            expect(response.body.message[0]).toEqual('password should not be empty');
            expect(response.body.error).toEqual('Bad Request');
          });
      });

      it('should return 400 status if passwordConfirmation is not provided', async () => {
        return await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD)
          .expect(HttpStatus.BAD_REQUEST).then(response => {
            expect(response.body.message[0]).toEqual('passwordConfirmation should not be empty');
            expect(response.body.error).toEqual('Bad Request');
          });
      });

      it('should return 400 status if invalid email is provided', async () => {
        return await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD)
          .expect(HttpStatus.BAD_REQUEST).then(response => {
            expect(response.body.message[0]).toEqual('email must be an email');
            expect(response.body.error).toEqual('Bad Request');
          });
      });

      it('should return 400 status if no role is provided', async () => {
        return await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ROLE)
          .expect(HttpStatus.BAD_REQUEST).then(response => {
            expect(response.body.message[0]).toEqual('role should not be empty');
            expect(response.body.error).toEqual('Bad Request');
          });
      });

      it('should return 500 status if already exisitng email is given', async () => {
        await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ).expect(HttpStatus.CREATED);
        return await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ)
          .expect(HttpStatus.INTERNAL_SERVER_ERROR).then(response => {
            expect(response.body.messages[0].email).toEqual('email must be unique');
            expect(response.body.error).toEqual('Internal Server Error');
          });
      });
    });

    describe('GET', () => {
      it('should return 200 status when user is returned', async () => {
        let id;
        await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ).expect(HttpStatus.CREATED).then(response => {
          id = response.body.id;
        });

        let jwtToken;
        await request(app.getHttpServer()).post('/authn/login').set('Content-Type', 'application/json').send(LOGIN_AUTHENTICATION).expect(HttpStatus.CREATED).then(response => {
          jwtToken = response.body.accessToken;
        });

        return request(app.getHttpServer()).get('/users/' + id).set('Authorization', 'bearer ' + jwtToken).expect(HttpStatus.OK).then(response => {
          expect(response.body.createdAt.valueOf()).not.toBe(TEST_USER.createdAt.valueOf());
          expect(response.body.email).toEqual(TEST_USER.email);
          expect(response.body.firstName).toEqual(TEST_USER.firstName);
          expect(response.body.id).toEqual(id);
          expect(response.body.lastLogin).toEqual(null);
          expect(response.body.lastName).toEqual(TEST_USER.lastName);
          expect(response.body.loginCount).toEqual(TEST_USER.loginCount.toString());
          expect(response.body.organization).toEqual(TEST_USER.organization);
          expect(response.body.role).toEqual(TEST_USER.role);
          expect(response.body.title).toEqual(TEST_USER.title);
          expect(response.body.updatedAt.valueOf()).not.toBe(TEST_USER.updatedAt.valueOf());
        });
      });

      it('should return 400 status if given invalid token', async () => {
        const id = -1;
        return request(app.getHttpServer()).get('/users/' + id).set('Authorization', 'bearer ' + 'badtoken').expect(HttpStatus.UNAUTHORIZED).then(response => {
          expect(response.body.message).toEqual('Unauthorized');
        });
      });
    });

    describe('PUT', () => {
      it('should return 200 status when user is updated', async () => {
        let id;
        await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ).expect(HttpStatus.CREATED).then(response => {
          id = response.body.id;
        });

        let jwtToken;
        await request(app.getHttpServer()).post('/authn/login').set('Content-Type', 'application/json').send(LOGIN_AUTHENTICATION).expect(HttpStatus.CREATED).then(response => {
          jwtToken = response.body.accessToken;
        });

        return (await request(app.getHttpServer()).put('/users/' + id).set('Authorization', 'bearer ' + jwtToken).send(UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD).expect(HttpStatus.OK).then(response => {
          expect(response.body.email).toEqual(UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.email);
          expect(response.body.firstName).toEqual(UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.firstName);
          expect(response.body.id).toEqual(id);
          expect(response.body.lastName).toEqual(UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.lastName);
          expect(response.body.organization).toEqual(UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.organization);
          expect(response.body.title).toEqual(UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.title);
          expect(response.body.role).toEqual(UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.role);
        }));
      });

      it('should return 400 status when currentPassword is empty', async () => {
        let id;
        await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ).expect(HttpStatus.CREATED).then(response => {
          id = response.body.id;
        });

        let jwtToken;
        await request(app.getHttpServer()).post('/authn/login').set('Content-Type', 'application/json').send(LOGIN_AUTHENTICATION).expect(HttpStatus.CREATED).then(response => {
          jwtToken = response.body.accessToken;
        });

        return (await request(app.getHttpServer()).put('/users/' + id).set('Authorization', 'bearer ' + jwtToken).send(UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD).expect(HttpStatus.BAD_REQUEST).then(response => {
          expect(response.body.message[0]).toEqual('currentPassword should not be empty');
          expect(response.body.error).toEqual('Bad Request');
        }));
      })

      it('should return 401 status when currentPassword is wrong', async () => {
        let id;
        await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ).expect(HttpStatus.CREATED).then(response => {
          id = response.body.id;
        });

        let jwtToken;
        await request(app.getHttpServer()).post('/authn/login').set('Content-Type', 'application/json').send(LOGIN_AUTHENTICATION).expect(HttpStatus.CREATED).then(response => {
          jwtToken = response.body.accessToken;
        });

        return request(app.getHttpServer()).put('/users/' + id).set('Authorization', 'bearer ' + jwtToken).send(UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD).expect(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('DELETE', () => {
    // it('should return 200 status after user is deleted', async () => {
    //   let id;
    //   await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ).expect(HttpStatus.CREATED).then(response => {
    //     id = response.body.id;
    //   });

      //   let jwtToken;
      //   await request(app.getHttpServer()).post('/authn/login').set('Content-Type', 'application/json').send(LOGIN_AUTHENTICATION).expect(HttpStatus.CREATED).then(response => {
      //     jwtToken = response.body.accessToken;
      //   });

      //   return (await request(app.getHttpServer()).delete('/users/' + id).set('Authorization', 'bearer ' + jwtToken).send(DELETE_USER_DTO_TEST_OBJ).expect(HttpStatus.OK).then(response => {
      //     expect(response.body.createdAt.valueOf()).not.toBe(TEST_USER.createdAt.valueOf());
      //       expect(response.body.email).toEqual(TEST_USER.email);
      //       expect(response.body.firstName).toEqual(TEST_USER.firstName);
      //       expect(response.body.id).toEqual(id);
      //       expect(response.body.lastLogin).toEqual(null);
      //       expect(response.body.lastName).toEqual(TEST_USER.lastName);
      //       expect(response.body.loginCount).toEqual(TEST_USER.loginCount.toString());
      //       expect(response.body.organization).toEqual(TEST_USER.organization);
      //       expect(response.body.role).toEqual(TEST_USER.role);
      //       expect(response.body.title).toEqual(TEST_USER.title);
      //       expect(response.body.updatedAt.valueOf()).not.toBe(TEST_USER.updatedAt.valueOf());
      //   }));
      // });

      // it('should return 401 status because password is wrong', async () => {
      //   let id;
      //   await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ).expect(HttpStatus.CREATED).then(response => {
      //     id = response.body.id;
      //   });

      //   let jwtToken;
      //   await request(app.getHttpServer()).post('/authn/login').set('Content-Type', 'application/json').send(LOGIN_AUTHENTICATION).expect(HttpStatus.CREATED).then(response => {
      //     jwtToken = response.body.accessToken;
      //   });

      //   return request(app.getHttpServer()).delete('/users/' + id).set('Authorization', 'bearer ' + jwtToken).send(DELETE_FAILURE_USER_DTO_TEST_OBJ).expect(HttpStatus.UNAUTHORIZED);
      // });

      it('should return 200 status after user is deleted by admin', async () => {
        let id;
        await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_ADMIN).expect(HttpStatus.CREATED).then(response => {
          id = response.body.id;
        });

        let jwtToken;
        await request(app.getHttpServer()).post('/authn/login').set('Content-Type', 'application/json').send(LOGIN_AUTHENTICATION).expect(HttpStatus.CREATED).then(response => {
          jwtToken = response.body.accessToken;
        });

        await request(app.getHttpServer()).delete('/users/' + id).set('Authorization', 'bearer ' + jwtToken).send(DELETE_USER_DTO_TEST_OBJ).expect(HttpStatus.OK).then(response => {
          expect(response.body.createdAt.valueOf()).not.toBe(ADMIN.createdAt.valueOf());
          expect(response.body.email).toEqual(ADMIN.email);
          expect(response.body.firstName).toEqual(ADMIN.firstName);
          expect(response.body.id).toEqual(id);
          expect(response.body.lastLogin).toEqual(null);
          expect(response.body.lastName).toEqual(ADMIN.lastName);
          expect(response.body.loginCount).toEqual(ADMIN.loginCount.toString());
          expect(response.body.organization).toEqual(ADMIN.organization);
          expect(response.body.role).toEqual(ADMIN.role);
          expect(response.body.title).toEqual(ADMIN.title);
          expect(response.body.updatedAt.valueOf()).not.toBe(ADMIN.updatedAt.valueOf());
        });

        return request(app.getHttpServer()).get('/users/' + id).set('Authorization', 'bearer ' + jwtToken).expect(HttpStatus.NOT_FOUND).then(response => {
          expect(response.body.message).toEqual('User with given id not found');
          expect(response.body.error).toEqual('Not Found');
        });
      });
    });
  });

  afterAll(async () => {
    await app.close();
    await databaseService.closeConnection();
  });
});
