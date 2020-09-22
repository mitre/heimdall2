import {Page} from 'puppeteer';

export class FormVerifier {
  // Verify that a form error element is present with the listed error
  async verifyVMessageErrorPresent(page: Page, error: string): Promise<void> {
    const toastText = await page.$eval(
      '.v-messages__message',
      el => el.innerHTML
    );
    expect(toastText).toContain(error);
  }
}
