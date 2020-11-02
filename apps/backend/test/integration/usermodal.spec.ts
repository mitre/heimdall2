import {UserModalPage} from './pages/user-modal.page';
import {LogInPage} from './pages/log-in.page';
import {UploadNexusPage} from './pages/upload-nexus.page';
import {UploadNexusVerifier} from './verifiers/upload-nexus.verifier';
import {DatabaseService} from '../../src/database/database.service';
import {AppModule} from '../../src/app.module';
import {ConfigService} from '../../src/config/config.service';
import {IntegrationSpecHelper} from './helpers/integration-spec.helper';
import {Test, TestingModule} from '@nestjs/testing';
import {
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION
} from '../constants/users-test.constant';

describe('User Modal', () => {
  let databaseService: DatabaseService;
  let configService: ConfigService;
  let appUrl: string;
  let integrationSpecHelper: IntegrationSpecHelper;

  const logInPage = new LogInPage();
  const userModalPage = new UserModalPage();
  const uploadNexusPage = new UploadNexusPage();
  const uploadNexusVerifier = new UploadNexusVerifier();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DatabaseService, ConfigService]
    }).compile();

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    appUrl = `http://localhost:${configService.get('PORT') || '3000'}`;

    integrationSpecHelper = new IntegrationSpecHelper(appUrl);
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    // Must navigate to appUrl to get permissions to access local storage
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto(appUrl);
    await integrationSpecHelper.addUser(CREATE_USER_DTO_TEST_OBJ);
    await logInPage.loginSuccess(page, LOGIN_AUTHENTICATION);
    await uploadNexusVerifier.verifyNexusLoaded(page);
    await uploadNexusPage.switchToTab(page, 'sample');
    await uploadNexusPage.loadFirstSample(page);
  });

  describe('User Profile Modal', () => {
    it('opens successully', async () => {
      await userModalPage.userMenu(page);
    });
  });
});
