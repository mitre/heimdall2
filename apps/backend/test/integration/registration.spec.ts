import {Test, TestingModule} from '@nestjs/testing';
import {AppModule} from '../../src/app.module';
import {ConfigService} from '../../src/config/config.service';
import {DatabaseService} from '../../src/database/database.service';
import {
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS
} from '../constants/users-test.constant';
import {LogInPage} from './pages/log-in.page';
import {RegistrationPage} from './pages/registration.page';
import {FormVerifier} from './verifiers/form.verifier';
import {LogInVerifier} from './verifiers/log-in.verifier';
import {RegistrationVerifier} from './verifiers/registration.verifier';
import {ToastVerifier} from './verifiers/toast.verifier';

describe('Registration', () => {
  let databaseService: DatabaseService;
  let configService: ConfigService;
  let appUrl: string;

  const formVerifier = new FormVerifier();
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

    appUrl = `http://localhost:${configService.get('PORT') || '3000'}`;
  });

  beforeEach(async () => {
    await page.goto(appUrl + '/signup');
  });

  afterEach(async () => {
    await page.evaluate(() => {
      localStorage.clear();
    });
    await databaseService.cleanAll();
  });

  describe('Registration Form', () => {
    it('allows a user to create an account', async () => {
      await registrationPage.registerSuccess(page, CREATE_USER_DTO_TEST_OBJ);
      await logInVerifier.verifyLoginFormPresent(page);
      await toastVerifier.verifySuccessPresent(
        page,
        'You have successfully registered, please sign in'
      );
    });

    it('rejects passwords that do not match', async () => {
      await registrationPage.registerFailure(
        page,
        CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS
      );
      await registrationVerifier.verifyRegistrationFormPresent(page);
    });

    it('rejects emails that already exist', async () => {
      await registrationPage.registerSuccess(page, CREATE_USER_DTO_TEST_OBJ);
      await logInPage.dismissToast(page);
      await logInPage.switchToRegister(page);
      await registrationPage.registerFailure(page, CREATE_USER_DTO_TEST_OBJ);
      await toastVerifier.verifyErrorPresent(page, 'Email must be unique');
    });
  });

  afterAll(async () => {
    await page.evaluate(() => {
      localStorage.clear();
    });
    await databaseService.closeConnection();
  });
});
