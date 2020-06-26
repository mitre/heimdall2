import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DatabaseService } from './../src/database/database.service';
import {
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION,
  BAD_LOGIN_AUTHENTICATION
} from './test.constants';

describe('/authn', () => {
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

  describe('/login', () => {
    it('should successfully return access token', async () => {
      await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ).expect(HttpStatus.CREATED);
      return await request(app.getHttpServer()).post('/authn/login').set('Content-Type', 'application/json').send(LOGIN_AUTHENTICATION).expect(HttpStatus.CREATED).then(response => {
        expect(response.body.accessToken).toBeDefined();
      });
    });

    it('should return 401 status when bad login info is supplied', async () => {
      await request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ).expect(HttpStatus.CREATED);
      return request(app.getHttpServer()).post('/authn/login').set('Content-Type', 'application/json').send(BAD_LOGIN_AUTHENTICATION).expect(HttpStatus.UNAUTHORIZED);
    });
  })

  afterAll(async () => {
    await databaseService.cleanAll();
    await app.close();
    await databaseService.closeConnection();
  });
})
