import {login, register} from './pages/Login';
import {AppModule} from '../../src/app.module';
import {Test, TestingModule} from '@nestjs/testing';

import {
  CREATE_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ,
  BAD_LOGIN_AUTHENTICATION,
  ADMIN_LOGIN_AUTHENTICATION,
  WRONG_EMAIL_AUTHENTICATION
} from '../constants/users-test.constant';
import {DatabaseService} from '../../src/database/database.service';

describe('Login', () => {
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DatabaseService]
    }).compile();

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
  });
  beforeEach(async () => {
    await page.goto('http:/localhost:8000/');
  });
  afterEach(async () => {
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  it('Login working', async () => {
    await register(CREATE_ADMIN_DTO);
    const response = await login(page, ADMIN_LOGIN_AUTHENTICATION);
    await expect(response).toBe(201);
    await expect(page.url()).toBe('http://localhost:8000/profile');
    const searchValue = await page.$eval('#upload-btn > span', el => el.innerHTML);
    expect(searchValue).toContain('Upload');
    const searchValue2 = await page.$eval('#logout > span', el => el.innerHTML);
    expect(searchValue2).toContain('Logout');

  });

  it('Login failure with wrong password', async () => {
    await register(CREATE_USER_DTO_TEST_OBJ);
    const response = await login(page, BAD_LOGIN_AUTHENTICATION);
    await expect(response).toBe(401);
    await expect(page.url()).toBe('http://localhost:8000/login');
  });

  it('Login failure when user does not exist', async () => {
    const response = await login(page, WRONG_EMAIL_AUTHENTICATION);
    await expect(response).toBe(404);
    await expect(page.url()).toBe('http://localhost:8000/login');

    await page.waitForFunction(
      'document.querySelector("body").innerText.includes("ERROR: User with given id not found")'
    );
    const text = await page.evaluate(() => document.body.innerHTML);
    await expect(text).toContain('ERROR: User with given id not found');
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    //      await databaseService.closeConnection();
  });
  

});

describe('Logout', () => {
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DatabaseService]
    }).compile();

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
  });
  beforeEach(async () => {
    await page.goto('http:/localhost:8000/');
  });
  afterEach(async () => {
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  it('Logout working', async () => {
    await register(CREATE_ADMIN_DTO);
    const response = await login(page, ADMIN_LOGIN_AUTHENTICATION);
    await expect(response).toBe(201);
    await expect(page.url()).toBe('http://localhost:8000/profile');
    page.click('#logout');

    await page.waitForSelector('#login');
    await expect(page.url()).toBe('http://localhost:8000/login');
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    //      await databaseService.closeConnection();
  });
  

});