/// <reference types="cypress" />

import DatabaseHelper from './helpers/DatabaseHelper';

const databaseHelper = new DatabaseHelper();

beforeEach(function () {
  databaseHelper.clear();
});
