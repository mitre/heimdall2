import {UserDto} from "../../../apps/backend/src/users/dto/user.dto";

export default class RegistrationPage {
  
  loginSuccess(user: any) {
    cy.get('input[name=email]').type(user.email);
    cy.get('input[name=password]').type(user.password);
    cy.get('#login_button').click();
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
