import {login} from './pages/Login';
import {register} from './pages/Registration';
import {
  CREATE_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS,
  CREATE_USER_DTO_TEST_OBJ_2,
  BAD_LOGIN_AUTHENTICATION,
  ADMIN_LOGIN_AUTHENTICATION
} from '../constants/users-test.constant';

describe('Login and Logout', () => {
  beforeEach(async () => {
    await page.goto('http:/localhost:3000/');
  });
  afterEach(async () => {
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  it('Login working', async () => {
    const response = await login(page, ADMIN_LOGIN_AUTHENTICATION);
    await expect(response).toBe(201);
    await expect(page.url()).toBe('http://localhost:3000/profile');
  });

  it('Login failure with wrong password', async () => {
    const response = await login(page, BAD_LOGIN_AUTHENTICATION);
    await expect(response).toBe(401);
    await expect(page.url()).toBe('http://localhost:3000/login');
  });

  it('Login failure with wrong email', async () => {
    const response = await login(
      page,
      CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS
    );
    await expect(response).toBe(404);
    await expect(page.url()).toBe('http://localhost:3000/login');

    await page.waitForFunction(
      'document.querySelector("body").innerText.includes("ERROR: Unauthorized")'
    );
    const text = await page.evaluate(() => document.body.innerHTML);
    await expect(text).toContain('ERROR: Unauthorized');
  });

  it('Logout working', async () => {
    const response = await login(page, ADMIN_LOGIN_AUTHENTICATION);
    await expect(response).toBe(201);
    await expect(page.url()).toBe('http://localhost:3000/profile');
    page.click('#logout');

    await page.waitForSelector('#login');
    await expect(page.url()).toBe('http://localhost:3000/login');
  });
});
