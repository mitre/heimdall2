import {CreateUserDto} from '../../src/users/dto/create-user.dto';
import {DeleteUserDto} from '../../src/users/dto/delete-user.dto';
import {UpdateUserDto} from '../../src/users/dto/update-user.dto';
import {UserDto} from '../../src/users/dto/user.dto';
import {User} from '../../src/users/user.model';

/* eslint-disable @typescript-eslint/ban-ts-comment */

export const ID = '7';

export const MINUTE_IN_MILLISECONDS = 60000;

export const LOGIN_AUTHENTICATION = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP'
};

export const LDAP_AUTHENTICATION = {
  username: 'fry',
  password: 'fry'
};

export const ADMIN_LOGIN_AUTHENTICATION = {
  email: 'admin@yahoo.com',
  password: 'LETmeiN123$$$tP'
};

export const BAD_LOGIN_AUTHENTICATION = {
  email: 'abc@yahoo.com',
  password: 'Invalid_password'
};

export const BAD_LDAP_AUTHENTICATION = {
  username: 'fry',
  password: 'zoiderg'
};

// @ts-ignore
export const TEST_USER: User = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  role: 'user',
  title: 'fake title',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Fake Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

// @ts-ignore
export const TEST_USER_WITH_ID: User = {
  ...TEST_USER,
  id: '1'
};

// @ts-ignore
export const ADMIN: User = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  role: 'admin',
  title: 'fake title',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Fake Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

// @ts-ignore
export const ADMIN_WITH_ID: User = {
  ...ADMIN,
  id: '2'
};

// @ts-ignore
export const UPDATED_TEST_USER: User = {
  email: 'updatedemail@yahoo.com',
  firstName: 'Updated',
  lastName: 'Name',
  title: 'updated title',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Updated Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

// @ts-ignore
export const TEST_USER_WITHOUT_EMAIL: User = {
  firstName: 'Test',
  lastName: 'Dummy',
  role: 'user',
  title: 'fake title',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Fake Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

// @ts-ignore
export const TEST_USER_WITHOUT_FIRST_NAME: User = {
  email: 'abc@yahoo.com',
  lastName: 'Dummy',
  role: 'user',
  title: 'fake title',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Fake Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

// @ts-ignore
export const TEST_USER_WITHOUT_LAST_NAME: User = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  role: 'user',
  title: 'fake title',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Fake Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

// @ts-ignore
export const TEST_USER_WITHOUT_ORGANIZATION: User = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  role: 'user',
  title: 'fake title',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

// @ts-ignore
export const TEST_USER_WITHOUT_TITLE: User = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  role: 'user',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Fake Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

// @ts-ignore
export const TEST_USER_WITH_INVALID_ROLE: User = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  role: 'unknown',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Fake Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

// @ts-ignore
export const USER_ARRAY: User[] = [
  // @ts-ignore
  TEST_USER,
  // @ts-ignore
  TEST_USER_WITHOUT_FIRST_NAME,
  // @ts-ignore
  UPDATED_TEST_USER
];

export const CREATE_USER_DTO_TEST_OBJ: CreateUserDto = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'user',
  creationMethod: 'local'
};

export const CREATE_ADMIN_DTO: CreateUserDto = {
  email: 'admin@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'Admin',
  organization: 'Fake Org',
  role: 'admin',
  creationMethod: 'local'
};

export const CREATE_SECOND_ADMIN_DTO: CreateUserDto = {
  ...CREATE_ADMIN_DTO,
  email: 'admin2@yahoo.com'
};

export const CREATE_USER_DTO_TEST_OBJ_2: CreateUserDto = {
  email: 'def@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'user',
  creationMethod: 'local'
};

export const CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS: CreateUserDto =
  {
    email: 'abc@yahoo.com',
    password: 'LETmeiN123$$$tP',
    passwordConfirmation: 'LETmeiN123%%%tP',
    firstName: 'Test',
    lastName: 'Dummy',
    title: 'fake title',
    organization: 'Fake Org',
    role: 'user',
    creationMethod: 'local'
  };

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_FIRST_NAME: CreateUserDto = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  lastName: 'Dummy',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'user',
  creationMethod: 'local'
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_LAST_NAME: CreateUserDto = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'user',
  creationMethod: 'local'
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ORGANIZATION: CreateUserDto =
  {
    email: 'abc@yahoo.com',
    password: 'LETmeiN123$$$tP',
    passwordConfirmation: 'LETmeiN123$$$tP',
    firstName: 'Test',
    lastName: 'Dummy',
    title: 'fake title',
    role: 'user',
    creationMethod: 'local'
  };

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_TITLE: CreateUserDto = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  role: 'user',
  creationMethod: 'local'
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD: CreateUserDto =
  {
    password: 'LETmeiN123$$$tP',
    passwordConfirmation: 'LETmeiN123$$$tP',
    firstName: 'Test',
    lastName: 'Dummy',
    title: 'fake title',
    organization: 'Fake Org',
    role: 'user',
    creationMethod: 'local'
  };

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD: CreateUserDto =
  {
    email: 'NotAValidEmail',
    password: 'LETmeiN123$$$tP',
    passwordConfirmation: 'LETmeiN123$$$tP',
    firstName: 'Test',
    lastName: 'Dummy',
    title: 'fake title',
    organization: 'Fake Org',
    role: 'user',
    creationMethod: 'local'
  };

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD: CreateUserDto =
  {
    email: 'abc@yahoo.com',
    passwordConfirmation: 'LETmeiN123$$$tP',
    firstName: 'Test',
    lastName: 'Dummy',
    title: 'fake title',
    organization: 'Fake Org',
    role: 'user',
    creationMethod: 'local'
  };

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD: CreateUserDto =
  {
    email: 'abc@yahoo.com',
    password: 'LETmeiN123$$$tP',
    firstName: 'Test',
    lastName: 'Dummy',
    title: 'fake title',
    organization: 'Fake Org',
    role: 'user',
    creationMethod: 'local'
  };

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ROLE: CreateUserDto = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  organization: 'Fake Org',
  creationMethod: 'local'
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_PASSWORD: CreateUserDto = {
  email: 'abc@yahoo.com',
  password: 'InvalidPass1',
  passwordConfirmation: 'InvalidPass1',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'user',
  creationMethod: 'local'
};

export const UPDATE_USER_DTO_TEST_OBJ: UpdateUserDto = {
  email: 'updatedemail@yahoo.com',
  firstName: 'Updated',
  lastName: 'Name',
  organization: 'Updated Org',
  title: 'updated title',
  role: 'user',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  currentPassword: 'LETmeiN123$$$tP',
  forcePasswordChange: true
};

export const UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Updated',
  lastName: 'Name',
  organization: 'Updated Org',
  title: 'updated title',
  role: 'user',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  currentPassword: 'LETmeiN123$$$tP',
  forcePasswordChange: false
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_EMAIL: UpdateUserDto = {
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'user',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITH_INVALID_EMAIL: UpdateUserDto = {
  email: 'NotAValidEmail',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'user',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_FIRST_NAME: UpdateUserDto = {
  email: 'abc@yahoo.com',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'user',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_LAST_NAME: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'user',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_ORGANIZATION: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  role: 'user',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_TITLE: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  role: 'user',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_PASSWORD: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'user',
  passwordConfirmation: 'ABCdefG456!@#pT',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS: UpdateUserDto = {
  email: 'updated@example.com',
  firstName: 'Updated',
  lastName: 'Updated',
  organization: 'Updated',
  title: 'Updated',
  role: 'user',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_WITH_NO_CURRENT_PASSWORD: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'user',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT'
};

// @ts-ignore
export const UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD: UpdateUserDto = {
  ...UPDATE_USER_DTO_WITH_NO_CURRENT_PASSWORD,
  currentPassword: 'invalid_password'
};

// @ts-ignore
export const UPDATE_USER_DTO_WITH_ADMIN_ROLE: UpdateUserDto = {
  role: 'admin',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_PASSWORD_CONFIRMATION: UpdateUserDto =
  {
    email: 'abc@yahoo.com',
    firstName: 'Test',
    lastName: 'Dummy',
    organization: 'Fake Org',
    title: 'fake title',
    role: 'user',
    password: 'ABCdefG456!@#pT',
    currentPassword: 'LETmeiN123$$$tP'
  };

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_ROLE: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_FORCE_PASSWORD_CHANGE: UpdateUserDto =
  {
    email: 'changed@yahoo.com',
    currentPassword: 'LETmeiN123$$$tP'
  };

// @ts-ignore
export const UPDATE_USER_DTO_SETUP_FORCE_PASSWORD_CHANGE: UpdateUserDto = {
  forcePasswordChange: true,
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITH_NOT_COMPLEX_PASSWORD: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  password: 'Invalidpass1',
  passwordConfirmation: 'Invalidpass1',
  currentPassword: 'LETmeiN123$$$tP'
};

export const UPDATE_USER_DTO_TEST_OBJ_WITH_MISSMATCHING_PASSWORDS: UpdateUserDto =
  {
    email: 'updatedemail@yahoo.com',
    firstName: 'Updated',
    lastName: 'Name',
    organization: 'Updated Org',
    title: 'updated title',
    role: 'user',
    password: 'ABCdefG456!@#pT',
    passwordConfirmation: 'defABCg789*(%Pt',
    currentPassword: 'LETmeiN123$$$tP',
    forcePasswordChange: false
  };

// @ts-ignore
export const UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD: UpdateUserDto =
  {
    email: 'abc@yahoo.com',
    firstName: 'Test',
    lastName: 'Dummy',
    organization: 'Fake Org',
    title: 'fake title',
    role: 'user',
    password: 'ABCdefG456!@#pT',
    passwordConfirmation: 'ABCdefG456!@#pT'
  };

export const DELETE_USER_DTO_TEST_OBJ: DeleteUserDto = {
  password: 'LETmeiN123$$$tP'
};

export const DELETE_FAILURE_USER_DTO_TEST_OBJ: DeleteUserDto = {
  password: 'Invalid_password'
};

// @ts-ignore
export const DELETE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD: DeleteUserDto = {};

// TEST_USER dto
export const USER_ONE_DTO = new UserDto(USER_ARRAY[0]);

export const USER_TWO_DTO = new UserDto(USER_ARRAY[1]);

export const ADMIN_USER_DTO = new UserDto(ADMIN);

// UPDATED_TEST_USER dto
export const UPDATED_USER_DTO = new UserDto(USER_ARRAY[2]);

export const USER_DTO_WITHOUT_EMAIL = new UserDto(TEST_USER_WITHOUT_EMAIL);

export const USER_DTO_WITHOUT_FIRST_NAME = new UserDto(
  TEST_USER_WITHOUT_FIRST_NAME
);

export const USER_DTO_WITHOUT_LAST_NAME = new UserDto(
  TEST_USER_WITHOUT_LAST_NAME
);

export const USER_DTO_WITHOUT_ORGANIZATION = new UserDto(
  TEST_USER_WITHOUT_ORGANIZATION
);

export const USER_DTO_WITHOUT_TITLE = new UserDto(TEST_USER_WITHOUT_TITLE);

export const USER_DTO_ARRAY: UserDto[] = [USER_ONE_DTO, USER_TWO_DTO];

/* eslint-enable @typescript-eslint/ban-ts-comment */
