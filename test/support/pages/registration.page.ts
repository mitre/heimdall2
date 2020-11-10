import {CREATE_USER_DTO_TEST_OBJ} from "../../../apps/backend/test/constants/users-test.constant";

export class RegistrationPage {
  registerSuccess() {
    cy.get('form[name="signup_form"]').debug();
    // expect(page).toFillForm('form[name="signup_form"]', {
    //   email: CREATE_USER_DTO_TEST_OBJ.email,
    //   password: user.password,
    //   passwordConfirmation: user.passwordConfirmation
    // });
  }

  // registerFailure() {
  //   // passwordConfirmation is the field being tested here, therefore it
  //   // cannot be the last item filled in on the form, otherwise it will
  //   // still be in focus and the error will never display.
  //   await expect(page).toFillForm('form[name="signup_form"]', {
  //     email: user.email,
  //     passwordConfirmation: user.passwordConfirmation,
  //     password: user.password
  //   });
  // }
}
