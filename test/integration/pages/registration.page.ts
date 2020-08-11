import {Page, Response} from 'puppeteer';
import {CreateUserDto} from '../../../src/users/dto/create-user.dto';

export class RegistrationPage {
  async registerSuccess(page: Page, user: CreateUserDto): Promise<void> {
    await expect(page).toFillForm('form[name="signup_form"]', {
      email: user.email,
      password: user.password,
      passwordConfirmation: user.passwordConfirmation,
      role: user.role
    });
    await Promise.all([
      page.waitForNavigation({waitUntil: 'networkidle0'}),
      page.click('#register')
    ]);
  }

  async registerFailure(page: Page, user: CreateUserDto): Promise<void> {
    await expect(page).toFillForm('form[name="signup_form"]', {
      email: user.email,
      password: user.password,
      passwordConfirmation: user.passwordConfirmation,
      role: user.role
    });
    await Promise.all([
      page.waitForSelector('.toasted.white--text.toasted-primary.default'),
      page.click('#register')
    ]);
  }
}
