import {Page, Response} from 'puppeteer';

export class LandingPage {
  async login(page: Page, user): Promise<Response> {
    await expect(page).toFillForm('form[name="login_form"]', {
      login: user.email,
      password: user.password
    });
    await page.click('#login');
    return await page.waitForNavigation({waitUntil: 'domcontentloaded'});
  }
}
