import {LogInPage} from './pages/log-in.page';
import {LogInVerifier} from './verifiers/log-in.verifier';
import {UploadNexusPage} from './pages/upload-nexus.page';
import {UploadNexusVerifier} from './verifiers/upload-nexus.verifier';
import {ToastVerifier} from './verifiers/toast.verifier';
import {NavbarVerifier} from './verifiers/navbar.verifier';
import {IntegrationSpecHelper} from './helpers/integration-spec.helper';
import {AppModule} from '../../src/app.module';
import {Test, TestingModule} from '@nestjs/testing';
import {
  CREATE_USER_DTO_TEST_OBJ,
  BAD_LOGIN_AUTHENTICATION,
  LOGIN_AUTHENTICATION
} from '../constants/users-test.constant';
import {DatabaseService} from '../../src/database/database.service';
import {ConfigService} from '../../src/config/config.service';

describe('Authentication', () => {
  let databaseService: DatabaseService;
  let configService: ConfigService;
  let appUrl: string;
  let integrationSpecHelper: IntegrationSpecHelper;

  const logInPage = new LogInPage();
  const logInVerifier = new LogInVerifier();
  const toastVerifier = new ToastVerifier();
  const navbarVerifier = new NavbarVerifier();
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
  });

  describe('Login Form', () => {
    it('authenticates a user with valid credentials', async () => {
      // Scenario Description: A user successfully authenticates with username and
      // password. The navbar is checked for the presence of correct buttons and title
      await integrationSpecHelper.addUser(CREATE_USER_DTO_TEST_OBJ);
      await logInPage.loginSuccess(page, LOGIN_AUTHENTICATION);
      await uploadNexusVerifier.verifyNexusLoaded(page);
    });

    it('fails to authenticate a user with an incorrect password', async () => {
      // Scenario Description: If a user fails to authenticate they will be brought back
      // to the login form with an error.
      await integrationSpecHelper.addUser(CREATE_USER_DTO_TEST_OBJ);
      await logInPage.loginFailure(page, BAD_LOGIN_AUTHENTICATION);
      await logInVerifier.verifyLoginFormPresent(page);
      await toastVerifier.verifyErrorPresent(page, 'Unauthorized');
    });

    it('fails to find a user that does not exist', async () => {
      // Scenario Description: If a user is not found in the database an error toast will
      // be shown to the user.
      await logInPage.loginFailure(page, CREATE_USER_DTO_TEST_OBJ);
      await logInVerifier.verifyLoginFormPresent(page);
      await toastVerifier.verifyErrorPresent(
        page,
        'User with given id not found'
      );
    });
  });

  describe('Logout Button', () => {
    it('logs a user out', async () => {
      // Scenario Description: After successfully authenticating and then clicking log out
      // the user should see an empty log in page.
      await integrationSpecHelper.addUser(CREATE_USER_DTO_TEST_OBJ);
      await logInPage.loginSuccess(page, LOGIN_AUTHENTICATION);
      await uploadNexusVerifier.verifyNexusLoaded(page);
      await uploadNexusPage.switchToTab(page, 'database');
      await navbarVerifier.verifyLogout(page);
      await logInPage.logout(page);
      await logInVerifier.verifyLoginFormPresent(page);
    });
  });

  afterAll(async () => {
    await page.evaluate(() => {
      localStorage.clear();
    });
    await databaseService.closeConnection();
  });
});
