import {Page} from 'puppeteer';

export class UploadNexusPage {
  async switchToTab(page: Page, tab: string): Promise<void> {
    await Promise.all([
      await expect(page).toMatchElement(`#select-tab-${tab}`, {visible: true}),
      await expect(page).toClick(`#select-tab-${tab}`),
      await expect(page).toMatchElement(`#uploadtab-${tab}`)
    ]);
  }
  async loadFirstSample(page: Page): Promise<void> {
    await Promise.all([
      await expect(page).toMatchElement(`#sampleItem`, {visible: true}),
      await expect(page).toClick(`#sampleItem`)
    ]);
  }
}
