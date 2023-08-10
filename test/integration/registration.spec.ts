import {
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_PASSWORD,
  CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS
} from '../../apps/backend/test/constants/users-test.constant';
import RegistrationPage from '../support/pages/RegistrationPage';
import RegistrationVerifier from '../support/verifiers/RegistrationPageVerifier';
import ToastVerifier from '../support/verifiers/ToastVerifier';

context('Registration', () => {
  // Pages, verifiers, and modules
  const registrationPage = new RegistrationPage();
  const registrationVerifier = new RegistrationVerifier();
  const toastVerifier = new ToastVerifier();

  // Run before each test
  beforeEach(() => {
    cy.visit('/signup');
  });

  // The test
  describe('Registration Form', () => {
    it('allows a user to create an account', () => {
      registrationVerifier.registerFormPresent();
      registrationPage.register(CREATE_USER_DTO_TEST_OBJ);
      toastVerifier.toastTextContains(
        'You have successfully registered, please sign in'
      );
    });

    it('rejects emails that already exist', async () => {
      registrationPage.register(CREATE_USER_DTO_TEST_OBJ);
      registrationPage.register(CREATE_USER_DTO_TEST_OBJ);
      toastVerifier.toastTextContains('Email must be unique');
    });

    it('rejects a weak password', () => {
      cy.on('uncaught:exception', (err) => {
        expect(err.response.status).to.equal(400);

        // return false to prevent the error from
        // failing this test
        return false;
      });

      registrationPage.registerNoSubmit(
        CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_PASSWORD
      );
      registrationVerifier.registerButtonDisabled();
    });

    it('rejects mismatching passwords', () => {
      registrationPage.registerNoSubmit(
        CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS
      );
      registrationVerifier.registerButtonDisabled();
    });
  });
});
