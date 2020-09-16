import {Page} from 'puppeteer';

export class UploadNexusPage {
  async switchToTab(page: Page, tab: string): Promise<void> {
    await Promise.all([
      page.waitForSelector(`#uploadtab-${tab}`, {visible: true}),
      page.click(`#select-tab-${tab}`)
    ]);
  }
}
