import {Page, Response} from 'puppeteer';

export class LandingPage {
  async login(page: Page, user): Promise<Response> {
    await expect(page).toFillForm('#login_form', {
      login: user.email,
      password: user.password
    });
    await page.click('#login_button');
    return await page.waitForNavigation({waitUntil: 'domcontentloaded'});
  }

  async logout(page: Page): Promise<Response> {
    await page.click('#logout')
    return await page.waitForNavigation({waitUntil: 'domcontentloaded'});
  }
}
