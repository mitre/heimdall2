import {Page} from 'puppeteer';

const SNACKBAR_CONTENT_DIV = '.v-snack__content';

export class ToastVerifier {
  // Get the error from the page and then check its contents with error.
  async verifyErrorPresent(page: Page, error: string): Promise<void> {
    await page.waitForSelector(SNACKBAR_CONTENT_DIV);
    const toastText = await page.$eval(
      SNACKBAR_CONTENT_DIV,
      (el) => el.innerHTML
    );
    expect(toastText).toContain(error);
  }

  async verifySuccessPresent(page: Page, text: string): Promise<void> {
    await page.waitForSelector(SNACKBAR_CONTENT_DIV);
    const toastText = await page.$eval(
      SNACKBAR_CONTENT_DIV,
      (el) => el.innerHTML
    );
    expect(toastText).toContain(text);
  }

  async verifySuccessPresentSecondSnackbar(
    page: Page,
    text: string
  ): Promise<void> {
    await page.waitForSelector(SNACKBAR_CONTENT_DIV);
    const toastTexts = await page.$$eval(SNACKBAR_CONTENT_DIV, (options) =>
      options.map((option) => option.textContent)
    );
    console.log(toastTexts);
    const secondToast = toastTexts[1];
    expect(secondToast).toContain(text);
  }
}
