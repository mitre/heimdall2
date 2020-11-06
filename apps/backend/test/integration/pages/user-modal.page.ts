import {Page} from 'puppeteer';
import {UpdateUserDto} from 'src/users/dto/update-user.dto';

export class UserModalPage {
  async userMenu(page: Page): Promise<void> {
    await page.waitForSelector('#dropdown');
    await page.click('#dropdown');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const dropdownItems = await page.$x('//div[@role="menuitem"]');
    await dropdownItems[0].click();
    await page.waitForSelector('#firstName');
  }
  async passwordResetSuccess(page: Page, user: UpdateUserDto): Promise<void> {
    await page.waitForSelector('#toggleChangePassword');
    await page.click('#toggleChangePassword');
    await expect(page).toFillForm('form[name="changePassword"]', {
      currentPassword: user.currentPassword,
      newPassword: user.password,
      passwordConfirmation: user.passwordConfirmation
    });
    await page.click('#closeAndSaveChanges');
  }
}
