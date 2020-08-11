import {Page} from 'puppeteer';

export class NavbarVerifier {
  async verifyLogout(page: Page): Promise<void> {
    const logoutButton = await page.$eval('#logout > span', el => el.innerHTML);
    expect(logoutButton).toContain('Logout');
  }

  async verifyTitle(title: string): Promise<void> {
    const navbarTitle = await page.$eval('#toolbar_title > span', el => el.innerHTML);
    expect(navbarTitle).toEqual(title);
  }

  async verifyUpload(page: Page): Promise<void> {
    const uploadButton = await page.$eval('#upload-btn > span', el => el.innerHTML);
    expect(uploadButton).toContain('Upload');
  }
}
