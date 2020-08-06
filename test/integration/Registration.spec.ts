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

describe('Registration', () => {
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DatabaseService]
    }).compile();

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    await page.goto(process.env.APP_URL+'/signup');
  });

  it('Registration Success', async () => {
    const response = await register(page, CREATE_ADMIN_DTO);
    expect(response).toBe(201);
    const loginButton = await page.$eval('#login > span', el => el.innerHTML);
    await expect(loginButton).toContain('Login');
  });

  it("Registration failure because password doesn't match", async () => {
    const response = await register(
      page,
      CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS
    );
    expect(response).toBe(400);
    const registerButton = await page.$eval('#register > span', el => el.innerHTML);
    await expect(registerButton).toContain('Register');
  });

  it('Registration failure because email already exists', async () => {
    await addUser(CREATE_USER_DTO_TEST_OBJ_2);
    await page.goto(process.env.APP_URL+'/signup');
    page.waitForNavigation();
    const response = await register(page, CREATE_USER_DTO_TEST_OBJ_2);
    expect(response).toBe(500);
    const registerButton = await page.$eval('#register > span', el => el.innerHTML);
    await expect(registerButton).toContain('Register');

  });

  afterAll(async () => {
    await databaseService.closeConnection();
    //      await databaseService.closeConnection();
  });
});
