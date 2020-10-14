import {Page} from 'puppeteer';

export class LogInVerifier {
  async verifyLoginFormPresent(page: Page): Promise<void> {
    const loginFormHeader = await page.$eval(
      '#login_form_title',
      (el) => el.innerHTML
    );
    const emailLabel = await page.$eval(
      'label[for="email_field"]',
      (el) => el.innerHTML
    );
    const passwordLabel = await page.$eval(
      'label[for="password_field"]',
      (el) => el.innerHTML
    );
    const loginButton = await page.$eval(
      '#login_button > span',
      (el) => el.innerHTML
    );
    const signUpButton = await page.$eval(
      '#sign_up_button > span',
      (el) => el.innerHTML
    );

    expect(loginFormHeader).toContain('Login to Heimdall Server');
    expect(emailLabel).toContain('Email');
    expect(passwordLabel).toContain('Password');
    expect(loginButton).toContain('Login');
    expect(signUpButton).toContain('Sign Up');
  }
}
