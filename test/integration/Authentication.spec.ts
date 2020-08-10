import {LandingPage} from './pages/log-in.page';
import {LandingPageVerifier} from './verifiers/log-in.verifier';
import {ErrorVerifier} from './verifiers/error.verifier';
import {IntegrationSpecHelper} from './helpers/integration-spec.helper';
import {AppModule} from '../../src/app.module';
import {Test, TestingModule} from '@nestjs/testing';
import {
  CREATE_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ,
  BAD_LOGIN_AUTHENTICATION,
  ADMIN_LOGIN_AUTHENTICATION
} from '../constants/users-test.constant';
import {DatabaseService} from '../../src/database/database.service';
import {ConfigService} from '../../src/config/config.service';

describe('Authentication', () => {
  let databaseService: DatabaseService;
  let configService: ConfigService;
  let appUrl: string;
  let integrationSpecHelper: IntegrationSpecHelper;

  const landingPage = new LandingPage();
  const landingPageVerifier = new LandingPageVerifier();
  const errorVerifier = new ErrorVerifier();

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
    await page.goto(appUrl);
  });

  describe('Login Form', () => {
    it('authenticates a user with valid credentials', async () => {
      await integrationSpecHelper.addUser(CREATE_ADMIN_DTO);
      const response = await landingPage.login(
        page,
        ADMIN_LOGIN_AUTHENTICATION
      );
      await expect(response).toBe(201);
      const uploadButton = await page.$eval(
        '#upload-btn > span',
        el => el.innerHTML
      );
      expect(uploadButton).toContain('Upload');
      const logoutButton = await page.$eval(
        '#logout > span',
        el => el.innerHTML
      );
      expect(logoutButton).toContain('Logout');
    });

    it.only('fails to authenticate a user with an incorrect password', async () => {
      // Scenario Description: If a user fails to authenticate they will be brought back
      // to the login form with an error.
      await integrationSpecHelper.addUser(CREATE_USER_DTO_TEST_OBJ);
      await landingPage.login(page, BAD_LOGIN_AUTHENTICATION);
      await landingPageVerifier.verifyLoginFormPresent(page);
      await errorVerifier.verifyErrorPresent(page, 'Unauthorized')
    });

    it('fails to find a user that does not exist', async () => {
      const response = await landingPage.login(
        page,
        ADMIN_LOGIN_AUTHENTICATION
      );
      await page.waitForFunction(
        'document.querySelector("body").innerText.includes("ERROR: User with given id not found")'
      );
      const text = await page.evaluate(() => document.body.innerHTML);
      await expect(text).toContain('ERROR: User with given id not found');
      const loginButton = await page.$eval('#login > span', el => el.innerHTML);
      await expect(loginButton).toContain('Login');
    });
  });

  describe('Logout Button', () => {
    it('logs a user out', async () => {
      await integrationSpecHelper.addUser(CREATE_ADMIN_DTO);
      const response = await landingPage.login(page, ADMIN_LOGIN_AUTHENTICATION);
      await expect(response.status()).toBe(201);
      await landingPage.logout(page);
      const loginButton = await page.$eval('#login > span', el => el.innerHTML);
      await expect(loginButton).toContain('Login');
    });
  });

  afterAll(async () => {
    await page.evaluate(() => {
      localStorage.clear();
    });
    await databaseService.closeConnection();
  });
});
