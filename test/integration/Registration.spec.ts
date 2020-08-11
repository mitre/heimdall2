import {Test, TestingModule} from '@nestjs/testing';
import {AppModule} from '../../src/app.module';
import {IntegrationSpecHelper} from './helpers/integration-spec.helper';
import {
  CREATE_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS,
} from '../constants/users-test.constant';
import {RegistrationPage} from './pages/registration.page';
import {LogInPage} from './pages/log-in.page';
import {DatabaseService} from '../../src/database/database.service';
import {ConfigService} from '../../src/config/config.service';
import {LogInVerifier} from './verifiers/log-in.verifier';
import {ToastVerifier} from './verifiers/toast.verifier';
import {RegistrationVerifier} from './verifiers/registration.verifier';

describe('Registration', () => {
  let databaseService: DatabaseService;
  let configService: ConfigService;
  let appUrl: string;
  let integrationSpecHelper: IntegrationSpecHelper;

  const registrationPage = new RegistrationPage();
  const logInPage = new LogInPage();
  const logInVerifier = new LogInVerifier();
  const toastVerifier = new ToastVerifier();
  const registrationVerifier = new RegistrationVerifier();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DatabaseService, ConfigService]
    }).compile();

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    appUrl = `http://localhost:${configService.get('HEIMDALL_SERVER_PORT') || '3000'}`;

    integrationSpecHelper = new IntegrationSpecHelper(appUrl);
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    // Must navigate to appUrl to get permissions to access local storage
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto(appUrl + '/signup');
  });

  describe('Registration Form', () => {
    it('allows a user to create an account', async () => {
      await registrationPage.registerSuccess(page, CREATE_ADMIN_DTO);
      await logInVerifier.verifyLoginFormPresent(page);
      await toastVerifier.verifySuccessPresent(page, 'You have successfully registered, please sign in');
    });

    it('rejects passwords that do not match', async () => {
      await registrationPage.registerFailure(page, CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS);
      await registrationVerifier.verifyRegistrationFormPresent(page);
      await toastVerifier.verifyErrorPresent(page, 'Passwords do not match');
    });

    it('rejects emails that already exist', async () => {
      await registrationPage.registerSuccess(page, CREATE_ADMIN_DTO);
      await logInPage.switchToRegister(page);
      await registrationPage.registerFailure(page, CREATE_ADMIN_DTO);
      await toastVerifier.verifyErrorPresent(page, 'An unidentified error has occured');
    });
  });

  afterAll(async () => {
    await page.evaluate(() => {
      localStorage.clear();
    });
    await databaseService.closeConnection();
  });
});
