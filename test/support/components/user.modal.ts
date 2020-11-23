import {UpdateUserDto} from "../../../apps/backend/src/users/dto/update-user.dto";

export default class UserModal {
  openUserModal() {
    cy.get('#dropdown').click();
    cy.get('#userModal').click()
  }
  changeUserData(user: UpdateUserDto) {
    cy.get('input[name=firstName]').clear().type(user.firstName);
    cy.get('input[name=lastName]').clear().type(user.lastName);
    cy.get('input[name=email]').clear().type(user.email);
    cy.get('input[name=organization]').clear().type(user.organization);
    cy.get('input[name=password]').clear().type(user.currentPassword);
    cy.get('#toggleChangePassword').click();
    cy.get('input[name=newPassword]').clear().type(user.password);
    cy.get('input[name=repeatPassword]').clear().type(user.passwordConfirmation);
    cy.get('#closeAndSaveChanges').click();
  }
}
