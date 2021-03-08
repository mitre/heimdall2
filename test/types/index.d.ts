/// <reference types="cypress" />

import {CreateUserDto} from '../../apps/backend/src/users/dto/create-user.dto';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      login({
        email,
        password
      }: {
        email: string;
        password: string;
      }): Chainable<Subject>;
      register(user: CreateUserDto): Chainable<Subject>;
    }
  }
}
