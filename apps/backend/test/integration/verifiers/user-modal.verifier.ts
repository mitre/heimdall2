import {Page} from 'puppeteer';

export class UserModalVerifier {
  async verifyUserFieldsExist(page: Page): Promise<void> {
    const firstNameElement = await page.$eval(
      '#firstName',
      (el) => el.innerHTML
    );
    const firstNameLabel = await page.$eval(
      'label[for="firstName"]',
      (el) => el.innerHTML
    );

    const lastNameElement = await page.$eval('#lastName', (el) => el.innerHTML);
    const lastNameLabel = await page.$eval(
      'label[for="lastName"]',
      (el) => el.innerHTML
    );

    const emailElement = await page.$eval('#email', (el) => el.innerHTML);
    const emailLabel = await page.$eval(
      'label[for="email"]',
      (el) => el.innerHTML
    );

    const titleElement = await page.$eval('#title', (el) => el.innerHTML);
    const titleLabel = await page.$eval(
      'label[for="title"]',
      (el) => el.innerHTML
    );

    const organizationElement = await page.$eval(
      '#organization',
      (el) => el.innerHTML
    );
    const organizationLabel = await page.$eval(
      'label[for="organization"]',
      (el) => el.innerHTML
    );

    const currentPasswordElement = await page.$eval(
      '#currentPassword',
      (el) => el.innerHTML
    );
    const currentPasswordLabel = await page.$eval(
      'label[for="currentPassword"]',
      (el) => el.innerHTML
    );

    expect(firstNameElement);
    expect(firstNameLabel).toContain('First Name');

    expect(lastNameElement);
    expect(lastNameLabel).toContain('Last Name');

    expect(emailElement);
    expect(emailLabel).toContain('Email');

    expect(titleElement);
    expect(titleLabel).toContain('Title');

    expect(organizationElement);
    expect(organizationLabel).toContain('Organization');

    expect(currentPasswordElement);
    expect(currentPasswordLabel).toContain('Current Password');
  }
  async verifyUpdateUserToast(page: Page) {
    const toastTexts = await page.$x('//div[@class="v-snack__content"]');
  }
}
