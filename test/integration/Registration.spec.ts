import {Test, TestingModule} from '@nestjs/testing';
import {AppModule} from '../../src/app.module';
import {addUser} from './pages/Registration';
import {
  CREATE_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS,
  CREATE_USER_DTO_TEST_OBJ_2
} from '../constants/users-test.constant';
import {register} from './pages/Registration';
import {DatabaseService} from '../../src/database/database.service';
import {ConfigService} from '../../src/config/config.service';

describe('Registration', () => {
  let databaseService: DatabaseService;
  let configService: ConfigService;
  let appUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DatabaseService, ConfigService]
    }).compile();

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    appUrl = `localhost:${configService.get('HEIMDALL_SERVER_PORT' || '3000')}`;
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto(appUrl + '/signup');
  });

  describe('Registration Form', () => {
    it('allows a user to create an account', async () => {
      const response = await register(page, CREATE_ADMIN_DTO);
      expect(response).toBe(201);
      const loginButton = await page.$eval('#login > span', el => el.innerHTML);
      await expect(loginButton).toContain('Login');
    });

    it('rejects passwords that do not match', async () => {
      const response = await register(
        page,
        CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS
      );
      expect(response).toBe(400);
      const registerButton = await page.$eval(
        '#register > span',
        el => el.innerHTML
      );
      await expect(registerButton).toContain('Register');
    });

    it('rejects emails that already exist', async () => {
      await addUser(CREATE_USER_DTO_TEST_OBJ_2);
      page.waitForNavigation();
      const response = await register(page, CREATE_USER_DTO_TEST_OBJ_2);
      expect(response).toBe(500);
      const registerButton = await page.$eval(
        '#register > span',
        el => el.innerHTML
      );
      await expect(registerButton).toContain('Register');
    });
  });

  afterAll(async () => {
    await page.evaluate(() => {
      localStorage.clear();
    });
    await databaseService.closeConnection();
  });
});
