import {login} from './pages/Login';
import {addUser} from './pages/Registration';
import {AppModule} from '../../src/app.module';
import {Test, TestingModule} from '@nestjs/testing';
import {
  CREATE_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ,
  BAD_LOGIN_AUTHENTICATION,
  ADMIN_LOGIN_AUTHENTICATION,
} from '../constants/users-test.constant';
import {DatabaseService} from '../../src/database/database.service';
import {ConfigService} from '../../src/config/config.service';

describe('Authentication', () => {
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
    await page.goto(appUrl);
  });

  describe('Login Form', () => {
    it('authenticates a user with valid credentials', async () => {
      await addUser(CREATE_ADMIN_DTO);
      const response = await login(page, ADMIN_LOGIN_AUTHENTICATION);
      await expect(response).toBe(201);
      const uploadButton = await page.$eval(
        '#upload-btn > span',
        el => el.innerHTML
      );
      expect(uploadButton).toContain('Upload');
      const logoutButton = await page.$eval('#logout > span', el => el.innerHTML);
      expect(logoutButton).toContain('Logout');
    });

    it('fails to authenticate a user with an incorrect password', async () => {
      await addUser(CREATE_USER_DTO_TEST_OBJ);
      const response = await login(page, BAD_LOGIN_AUTHENTICATION);
      await expect(response).toBe(401);
      const loginButton = await page.$eval('#login > span', el => el.innerHTML);
      await expect(loginButton).toContain('Login');
    });

    it('fails to find a user that does not exist', async () => {
      const response = await login(page, ADMIN_LOGIN_AUTHENTICATION);
      await expect(response).toBe(404);

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
      await addUser(CREATE_ADMIN_DTO);
      const response = await login(page, ADMIN_LOGIN_AUTHENTICATION);
      await expect(response).toBe(201);
      page.click('#logout');
      await page.waitForSelector('#login');
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
