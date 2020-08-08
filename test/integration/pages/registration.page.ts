import {Page, Response} from 'puppeteer';
import {CreateUserDto} from '../../../src/users/dto/create-user.dto';

export class RegistrationPage {
  async register(page: Page, user: CreateUserDto): Promise<Response> {
    await expect(page).toFillForm('form[name="signup_form"]', {
      email: user.email,
      password: user.password,
      passwordConfirmation: user.passwordConfirmation,
      role: user.role
    });
    await page.click('Register');
    return await page.waitForNavigation({waitUntil: 'domcontentloaded'});
  }
}
