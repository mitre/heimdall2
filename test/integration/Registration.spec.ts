import {Test, TestingModule} from '@nestjs/testing';
import {AppModule} from '../../src/app.module';

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
  });

  it("Registration failure because password doesn't match", async () => {
    const response = await register(
      page,
      CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS
    );
    expect(response).toBe(400);
  });

  it('Registration failure because email already exists', async () => {
    const response = await register(page, CREATE_USER_DTO_TEST_OBJ_2);
    expect(response).toBe(201);
    await page.goto(process.env.APP_URL+'/signup');
    page.waitForNavigation();
    const response2 = await register(page, CREATE_USER_DTO_TEST_OBJ_2);
    expect(response2).toBe(500);
  });

  afterAll(async () => {
    await databaseService.closeConnection();
    //      await databaseService.closeConnection();
  });
});
