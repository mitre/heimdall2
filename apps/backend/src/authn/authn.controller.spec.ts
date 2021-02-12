import {HttpStatus, INestApplication, ValidationPipe} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import {
  BAD_LOGIN_AUTHENTICATION,
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION
} from '../../test/constants/users-test.constant';
import {login} from '../../test/helpers/users.helper';
import {AppModule} from '../app.module';
import {DatabaseService} from '../database/database.service';
import {UsersController} from '../users/users.controller';

describe('/authn', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let usersController: UsersController;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DatabaseService]
    }).compile();

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    usersController = moduleFixture.get<UsersController>(UsersController);

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
    await usersController.create(CREATE_USER_DTO_TEST_OBJ);
  });

  describe('login', () => {
    it('should successfully return access token', async () => {
      expect.assertions(1);

      return login(app, LOGIN_AUTHENTICATION)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body.accessToken).toBeDefined();
        });
    });

    it('should return 401 status when bad login info is supplied', async () => {
      expect.assertions(1);

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
