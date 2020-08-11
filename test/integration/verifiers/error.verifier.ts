import {Page} from 'puppeteer';

export class ErrorVerifier {
    // Get the error from the page and then check its contents with error.
  async verifyErrorPresent(page: Page, error: string): Promise<void> {
    const toastText = await page.$eval('.toasted.white--text', el => el.innerHTML);
    expect(toastText).toContain(error);
  }
}
