import {Test, TestingModule} from '@nestjs/testing';
import {AppModule} from '../../src/app.module';
import {IntegrationSpecHelper} from './helpers/integration-spec.helper';
import {
  CREATE_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS,
  CREATE_USER_DTO_TEST_OBJ_2
} from '../constants/users-test.constant';
import {RegistrationPage} from './pages/registration.page';
import {DatabaseService} from '../../src/database/database.service';
import {ConfigService} from '../../src/config/config.service';

describe('Registration', () => {
  let databaseService: DatabaseService;
  let configService: ConfigService;
  let appUrl: string;
  let integrationSpecHelper: IntegrationSpecHelper;
  const registrationPage = new RegistrationPage();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DatabaseService, ConfigService]
    }).compile();

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    appUrl = `http://localhost:${configService.get('HEIMDALL_SERVER_PORT') || '3000'}`;

    integrationSpecHelper = new IntegrationSpecHelper(appUrl);
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    // Must navigate to appUrl to get permissions to access local storage
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto(appUrl + '/signup');
  });

  describe('Registration Form', () => {
    it('allows a user to create an account', async () => {
      const response = await registrationPage.register(page, CREATE_ADMIN_DTO);
      expect(response).toBe(201);
      const loginButton = await page.$eval('#login > span', el => el.innerHTML);
      await expect(loginButton).toContain('Login');
    });

    it('rejects passwords that do not match', async () => {
      const response = await registrationPage.register(
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
      await integrationSpecHelper.addUser(CREATE_USER_DTO_TEST_OBJ_2);
      page.waitForNavigation();
      const response = await registrationPage.register(
        page,
        CREATE_USER_DTO_TEST_OBJ_2
      );
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
