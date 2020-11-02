import {Page} from 'puppeteer';

export class UserModalVerifier {
  async verifyUserFieldsExist(page: Page): Promise<void> {
    const firstName = await page.$eval(
      '.d-flex > .display-4',
      (el) => el.innerHTML
    );
    expect(navbarTitle).toEqual('Heimdall');
  }
}
