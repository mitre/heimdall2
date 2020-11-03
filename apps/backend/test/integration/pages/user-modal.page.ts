import {Page} from 'puppeteer';

export class UserModalPage {
  async userMenu(page: Page): Promise<void> {
    await Promise.all([
      page.waitForSelector('#dropdown'),
      page.click('#dropdown'),
      page.waitForSelector('#userProfile'),
      page.click('#userProfile')
    ]);
  }
}
