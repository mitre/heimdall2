import {HttpStatus, INestApplication, ValidationPipe} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import {AppModule} from './../src/app.module';
import {DatabaseService} from './../src/database/database.service';
import {
  BAD_LOGIN_AUTHENTICATION,
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION
} from './constants/users-test.constant';
import {login, register} from './helpers/users.helper';

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
      await register(app, CREATE_USER_DTO_TEST_OBJ).expect(HttpStatus.CREATED);
      return login(app, LOGIN_AUTHENTICATION)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body.accessToken).toBeDefined();
        });
    });

    it('should return 401 status when bad login info is supplied', async () => {
      await register(app, CREATE_USER_DTO_TEST_OBJ).expect(HttpStatus.CREATED);
      return login(app, BAD_LOGIN_AUTHENTICATION).expect(
        HttpStatus.UNAUTHORIZED
      );
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await app.close();
    await databaseService.closeConnection();
  });
});
