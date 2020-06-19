import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { DatabaseService } from './../src/database/database.service';
import { CREATE_USER_DTO_TEST_OBJ, CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS, TEST_USER, CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD, CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD, CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD } from './test.constants';

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
    describe('GET', () => {
      it('should GET', () => {
        return request(app.getHttpServer()).get('/users').expect(HttpStatus.NOT_FOUND);
      });
    });

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

      it('should return 400 status if already exisitng email is given', async () => {
        await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ).expect(HttpStatus.CREATED)
        return await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ)
          .expect(HttpStatus.INTERNAL_SERVER_ERROR).then(response => {
            expect(response.body.messages[0].email).toEqual('email must be unique');
            expect(response.body.error).toEqual('Internal Server Error');
          });
      });
    });

  });

  afterAll(async () => {
    await app.close();
    await databaseService.closeConnection();
  });
});
