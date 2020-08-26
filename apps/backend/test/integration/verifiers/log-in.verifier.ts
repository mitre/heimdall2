import {Page} from 'puppeteer';

export class LogInVerifier {
  async verifyLoginFormPresent(page: Page): Promise<void> {
    const loginFormHeader = await page.$eval(
      '#login_form_title',
      el => el.innerHTML
    );
    const loginLabel = await page.$eval(
      'label[for="login_field"]',
      el => el.innerHTML
    );
    const passwordLabel = await page.$eval(
      'label[for="password_field"]',
      el => el.innerHTML
    );
    const loginButton = await page.$eval(
      '#login_button > span',
      el => el.innerHTML
    );
    const signUpButton = await page.$eval(
      '#sign_up_button > span',
      el => el.innerHTML
    );

    expect(loginFormHeader).toContain('Login form');
    expect(loginLabel).toContain('Login');
    expect(passwordLabel).toContain('Password');
    expect(loginButton).toContain('Login');
    expect(signUpButton).toContain('Sign Up');
  }
}
