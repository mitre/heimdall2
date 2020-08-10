import {Page} from 'puppeteer';

export class ErrorVerifier {
  async verifyErrorsPresent(page: Page, error: string): Promise<void> {
    // Get the error from the page and then check its contents with error.
  }
}
