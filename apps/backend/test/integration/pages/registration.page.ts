import {Page} from 'puppeteer';
import {CreateUserDto} from '../../../src/users/dto/create-user.dto';

export class RegistrationPage {
  async registerSuccess(page: Page, user: CreateUserDto): Promise<void> {
    await expect(page).toFillForm('form[name="signup_form"]', {
      email: user.email,
      password: user.password,
      passwordConfirmation: user.passwordConfirmation
    });
    await Promise.all([
      page.waitForNavigation({waitUntil: 'networkidle0'}),
      page.click('#register')
    ]);
  }

  async registerFailure(page: Page, user: CreateUserDto): Promise<void> {
    // passwordConfirmation is the field being tested here, therefore it
    // cannot be the last item filled in on the form, otherwise it will
    // still be in focus and the error will never display.
    await expect(page).toFillForm('form[name="signup_form"]', {
      email: user.email,
      passwordConfirmation: user.passwordConfirmation,
      password: user.password
    });
  }
}
