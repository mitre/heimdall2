import {Page} from 'puppeteer';

export class ToastVerifier {
  // Get the error from the page and then check its contents with error.
  async verifyErrorPresent(page: Page, error: string): Promise<void> {
    const toastText = await page.$eval(
      '.v-snack__content',
      (el) => el.innerHTML
    );
    expect(toastText).toContain(error);
  }

  async verifySuccessPresent(page: Page, text: string): Promise<void> {
    const toastText = await page.$eval(
      '.v-snack__content',
      (el) => el.innerHTML
    );
    expect(toastText).toContain(text);
  }

  async verifySuccessPresentSecondSnackbar(
    page: Page,
    text: string
  ): Promise<void> {
    const toastTexts = await page.$$eval('.v-snack__content', (options) =>
      options.map((option) => option.textContent)
    );
    console.log(toastTexts);
    const secondToast = toastTexts[1];
    expect(secondToast).toContain(text);
  }
}
