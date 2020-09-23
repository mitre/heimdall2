import {Page} from 'puppeteer';

export class UploadNexusVerifier {
  async verifyNexusLoaded(page: Page): Promise<void> {
    const navbarTitle = await page.$eval(
      '.d-flex > .display-4',
      el => el.innerHTML
    );
    expect(navbarTitle).toEqual('Heimdall');
  }
}
