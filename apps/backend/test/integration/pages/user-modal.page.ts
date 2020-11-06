import {Page} from 'puppeteer';

export class UserModalPage {
  async userMenu(page: Page): Promise<void> {
    await page.waitForSelector('#dropdown');
    await page.click('#dropdown');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const dropdownItems = await page.$x('//div[@role="menuitem"]');
    await dropdownItems[0].click();
    await page.waitForSelector('#firstName');
  }
  async passwordResetSuccess(page: Page, user: any): Promise<void> {
    await page.waitForSelector('#toggleChangePassword');
    await page.click('#toggleChangePassword');
    await page.waitForSelector('#newPassword');
    await expect(page).toFillForm('form[name="changePassword"]', {
      currentPassword: user.currentPassword,
      newPassword: 'LETmeiN123$$$tP',
      passwordConfirmation: 'LETmeiN123$$$tP'
    });
    await page.click('#closeAndSaveChanges');
  }
}
