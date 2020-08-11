import {Page} from 'puppeteer';

export class RegistrationVerifier {
  async verifyRegistrationFormPresent(page: Page): Promise<void> {
    const registrationFormHeader = await page.$eval('#registration_form_title', el => el.innerHTML);
    const emailLabel = await page.$eval('label[for="email_field"]', el => el.innerHTML);
    const passwordLabel = await page.$eval('label[for="password"]', el => el.innerHTML);
    const passwordConfirmationLabel = await page.$eval('label[for="passwordConfirmation"]', el => el.innerHTML);
    const roleLabel = await page.$eval('label[for="role"]', el => el.innerHTML);
    const registerButton = await page.$eval('#register > span', el => el.innerHTML);
    const logInButton = await page.$eval('#login_button > span', el => el.innerHTML);

    expect(registrationFormHeader).toEqual('Registration form');
    expect(emailLabel).toEqual('Email');
    expect(passwordLabel).toContain('Password');
    expect(passwordConfirmationLabel).toEqual('Confirm Password');
    expect(roleLabel).toEqual('Role');
    expect(registerButton).toContain('Register');
    expect(logInButton).toEqual('Login');
  }
}
