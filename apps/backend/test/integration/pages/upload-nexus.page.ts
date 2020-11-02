import {Page} from 'puppeteer';

export class UploadNexusPage {
  async switchToTab(page: Page, tab: string): Promise<void> {
    await Promise.all([
      page.waitForSelector(`#select-tab-${tab}`, {visible: true}),
      page.click(`#select-tab-${tab}`)
    ]);
  }
  async loadFirstSample(page: Page): Promise<void> {
    await Promise.all([
      page.click(
        `//*[@id="uploadtab-samples"]/div/div[2]/div/div/div[1]/table/tbody/tr[1]/td[1]/div/i`
      )
    ]);
  }
}
