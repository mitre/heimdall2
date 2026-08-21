import { type MongoAbility } from '@casl/ability';
import { type FindOptions } from 'sequelize';
import { type CreateUserDto } from '../../src/users/dto/create-user.dto';
import { type DeleteUserDto } from '../../src/users/dto/delete-user.dto';
import { type UpdateUserDto } from '../../src/users/dto/update-user.dto';
import { UserDto } from '../../src/users/dto/user.dto';
import { User } from '../../src/users/user.model';

/* eslint-disable @typescript-eslint/ban-ts-comment */

export const ID = '7';

export const MINUTE_IN_MILLISECONDS = 60_000;

export const LOGIN_AUTHENTICATION = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP',
};

export const LDAP_AUTHENTICATION = {
  password: 'fry',
  username: 'fry',
};

export const ADMIN_LOGIN_AUTHENTICATION = {
  email: 'admin@yahoo.com',
  password: 'LETmeiN123$$$tP',
};

export const BAD_LOGIN_AUTHENTICATION = {
  email: 'abc@yahoo.com',
  password: 'Invalid_password',
};

export const BAD_LDAP_AUTHENTICATION = {
  password: 'zoiderg',
  username: 'fry',
};

export const SPLUNK_AUTHENTICATION = {
  hostname: 'https://localhost:8089',
  password: 'Valid_password!',
  username: 'admin',
};

export const BAD_SPLUNK_AUTHENTICATION = {
  hostname: 'https://localhost:8089',
  password: 'Invalid_password!',
  username: 'admin',
};

// @ts-ignore
export const TEST_USER: User = {
  createdAt: new Date(),
  email: 'abc@yahoo.com',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  firstName: 'Test',
  lastLogin: new Date(),
  lastName: 'Dummy',
  loginCount: 0,
  organization: 'Fake Org',
  role: 'user',
  title: 'fake title',
  updatedAt: new Date(),
};

// @ts-ignore
export const TEST_USER_WITH_ID: User = {
  ...TEST_USER,
  id: '1',
};

// @ts-ignore
export const ADMIN: User = {
  createdAt: new Date(),
  email: 'abc@yahoo.com',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  firstName: 'Test',
  lastLogin: new Date(),
  lastName: 'Dummy',
  loginCount: 0,
  organization: 'Fake Org',
  role: 'admin',
  title: 'fake title',
  updatedAt: new Date(),
};

// @ts-ignore
export const ADMIN_WITH_ID: User = {
  ...ADMIN,
  id: '2',
};

// @ts-ignore
export const UPDATED_TEST_USER: User = {
  createdAt: new Date(),
  email: 'updatedemail@yahoo.com',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  firstName: 'Updated',
  lastLogin: new Date(),
  lastName: 'Name',
  loginCount: 0,
  organization: 'Updated Org',
  title: 'updated title',
  updatedAt: new Date(),
};

// @ts-ignore
export const TEST_USER_WITHOUT_EMAIL: User = {
  createdAt: new Date(),
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  firstName: 'Test',
  lastLogin: new Date(),
  lastName: 'Dummy',
  loginCount: 0,
  organization: 'Fake Org',
  role: 'user',
  title: 'fake title',
  updatedAt: new Date(),
};

// @ts-ignore
export const TEST_USER_WITHOUT_FIRST_NAME: User = {
  createdAt: new Date(),
  email: 'abc@yahoo.com',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  lastLogin: new Date(),
  lastName: 'Dummy',
  loginCount: 0,
  organization: 'Fake Org',
  role: 'user',
  title: 'fake title',
  updatedAt: new Date(),
};

// @ts-ignore
export const TEST_USER_WITHOUT_LAST_NAME: User = {
  createdAt: new Date(),
  email: 'abc@yahoo.com',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  firstName: 'Test',
  lastLogin: new Date(),
  loginCount: 0,
  organization: 'Fake Org',
  role: 'user',
  title: 'fake title',
  updatedAt: new Date(),
};

// @ts-ignore
export const TEST_USER_WITHOUT_ORGANIZATION: User = {
  createdAt: new Date(),
  email: 'abc@yahoo.com',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  firstName: 'Test',
  lastLogin: new Date(),
  lastName: 'Dummy',
  loginCount: 0,
  role: 'user',
  title: 'fake title',
  updatedAt: new Date(),
};

// @ts-ignore
export const TEST_USER_WITHOUT_TITLE: User = {
  createdAt: new Date(),
  email: 'abc@yahoo.com',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  firstName: 'Test',
  lastLogin: new Date(),
  lastName: 'Dummy',
  loginCount: 0,
  organization: 'Fake Org',
  role: 'user',
  updatedAt: new Date(),
};

// @ts-ignore
export const TEST_USER_WITH_INVALID_ROLE: User = {
  createdAt: new Date(),
  email: 'abc@yahoo.com',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword:
    '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  firstName: 'Test',
  lastLogin: new Date(),
  lastName: 'Dummy',
  loginCount: 0,
  organization: 'Fake Org',
  role: 'unknown',
  updatedAt: new Date(),
};

// @ts-ignore
export const USER_ARRAY: User[] = [
  // @ts-ignore
  TEST_USER,
  // @ts-ignore
  TEST_USER_WITHOUT_FIRST_NAME,
  // @ts-ignore
  UPDATED_TEST_USER,
];

export const CREATE_USER_DTO_TEST_OBJ: CreateUserDto = {
  creationMethod: 'local',
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  role: 'user',
  title: 'fake title',
};

export const CREATE_ADMIN_DTO: CreateUserDto = {
  creationMethod: 'local',
  email: 'admin@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  role: 'admin',
  title: 'Admin',
};

export const CREATE_SECOND_ADMIN_DTO: CreateUserDto = {
  ...CREATE_ADMIN_DTO,
  email: 'admin2@yahoo.com',
};

export const CREATE_USER_DTO_TEST_OBJ_2: CreateUserDto = {
  creationMethod: 'local',
  email: 'def@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  role: 'user',
  title: 'fake title',
};

export const CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS: CreateUserDto
  = {
    creationMethod: 'local',
    email: 'abc@yahoo.com',
    firstName: 'Test',
    lastName: 'Dummy',
    organization: 'Fake Org',
    password: 'LETmeiN123$$$tP',
    passwordConfirmation: 'LETmeiN123%%%tP',
    role: 'user',
    title: 'fake title',
  };

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_FIRST_NAME: CreateUserDto = {
  creationMethod: 'local',
  email: 'abc@yahoo.com',
  lastName: 'Dummy',
  organization: 'Fake Org',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  role: 'user',
  title: 'fake title',
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_LAST_NAME: CreateUserDto = {
  creationMethod: 'local',
  email: 'abc@yahoo.com',
  firstName: 'Test',
  organization: 'Fake Org',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  role: 'user',
  title: 'fake title',
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ORGANIZATION: CreateUserDto
  = {
    creationMethod: 'local',
    email: 'abc@yahoo.com',
    firstName: 'Test',
    lastName: 'Dummy',
    password: 'LETmeiN123$$$tP',
    passwordConfirmation: 'LETmeiN123$$$tP',
    role: 'user',
    title: 'fake title',
  };

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_TITLE: CreateUserDto = {
  creationMethod: 'local',
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  role: 'user',
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD: CreateUserDto
  = {
    creationMethod: 'local',
    firstName: 'Test',
    lastName: 'Dummy',
    organization: 'Fake Org',
    password: 'LETmeiN123$$$tP',
    passwordConfirmation: 'LETmeiN123$$$tP',
    role: 'user',
    title: 'fake title',
  };

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD: CreateUserDto
  = {
    creationMethod: 'local',
    email: 'NotAValidEmail',
    firstName: 'Test',
    lastName: 'Dummy',
    organization: 'Fake Org',
    password: 'LETmeiN123$$$tP',
    passwordConfirmation: 'LETmeiN123$$$tP',
    role: 'user',
    title: 'fake title',
  };

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD: CreateUserDto
  = {
    creationMethod: 'local',
    email: 'abc@yahoo.com',
    firstName: 'Test',
    lastName: 'Dummy',
    organization: 'Fake Org',
    passwordConfirmation: 'LETmeiN123$$$tP',
    role: 'user',
    title: 'fake title',
  };

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD: CreateUserDto
  = {
    creationMethod: 'local',
    email: 'abc@yahoo.com',
    firstName: 'Test',
    lastName: 'Dummy',
    organization: 'Fake Org',
    password: 'LETmeiN123$$$tP',
    role: 'user',
    title: 'fake title',
  };

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ROLE: CreateUserDto = {
  creationMethod: 'local',
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  title: 'fake title',
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_PASSWORD: CreateUserDto = {
  creationMethod: 'local',
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  password: 'InvalidPass1',
  passwordConfirmation: 'InvalidPass1',
  role: 'user',
  title: 'fake title',
};

export const UPDATE_USER_DTO_TEST_OBJ: UpdateUserDto = {
  currentPassword: 'LETmeiN123$$$tP',
  email: 'updatedemail@yahoo.com',
  firstName: 'Updated',
  forcePasswordChange: true,
  lastName: 'Name',
  organization: 'Updated Org',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  role: 'user',
  title: 'updated title',
};

export const UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD: UpdateUserDto = {
  currentPassword: 'LETmeiN123$$$tP',
  email: 'abc@yahoo.com',
  firstName: 'Updated',
  forcePasswordChange: false,
  lastName: 'Name',
  organization: 'Updated Org',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  role: 'user',
  title: 'updated title',
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_EMAIL: UpdateUserDto = {
  currentPassword: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  role: 'user',
  title: 'fake title',
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITH_INVALID_EMAIL: UpdateUserDto = {
  currentPassword: 'LETmeiN123$$$tP',
  email: 'NotAValidEmail',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  role: 'user',
  title: 'fake title',
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_FIRST_NAME: UpdateUserDto = {
  currentPassword: 'LETmeiN123$$$tP',
  email: 'abc@yahoo.com',
  lastName: 'Dummy',
  organization: 'Fake Org',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  role: 'user',
  title: 'fake title',
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_LAST_NAME: UpdateUserDto = {
  currentPassword: 'LETmeiN123$$$tP',
  email: 'abc@yahoo.com',
  firstName: 'Test',
  organization: 'Fake Org',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  role: 'user',
  title: 'fake title',
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_ORGANIZATION: UpdateUserDto = {
  currentPassword: 'LETmeiN123$$$tP',
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  role: 'user',
  title: 'fake title',
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_TITLE: UpdateUserDto = {
  currentPassword: 'LETmeiN123$$$tP',
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  role: 'user',
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_PASSWORD: UpdateUserDto = {
  currentPassword: 'LETmeiN123$$$tP',
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  passwordConfirmation: 'ABCdefG456!@#pT',
  role: 'user',
  title: 'fake title',
};

// @ts-ignore
export const UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS: UpdateUserDto = {
  currentPassword: 'LETmeiN123$$$tP',
  email: 'updated@example.com',
  firstName: 'Updated',
  lastName: 'Updated',
  organization: 'Updated',
  role: 'user',
  title: 'Updated',
};

// @ts-ignore
export const UPDATE_USER_DTO_WITH_NO_CURRENT_PASSWORD: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  role: 'user',
  title: 'fake title',
};

// @ts-ignore
export const UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD: UpdateUserDto = {
  ...UPDATE_USER_DTO_WITH_NO_CURRENT_PASSWORD,
  currentPassword: 'invalid_password',
};

// @ts-ignore
export const UPDATE_USER_DTO_WITH_ADMIN_ROLE: UpdateUserDto = {
  currentPassword: 'LETmeiN123$$$tP',
  role: 'admin',
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_PASSWORD_CONFIRMATION: UpdateUserDto
  = {
    currentPassword: 'LETmeiN123$$$tP',
    email: 'abc@yahoo.com',
    firstName: 'Test',
    lastName: 'Dummy',
    organization: 'Fake Org',
    password: 'ABCdefG456!@#pT',
    role: 'user',
    title: 'fake title',
  };

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_ROLE: UpdateUserDto = {
  currentPassword: 'LETmeiN123$$$tP',
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  title: 'fake title',
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_FORCE_PASSWORD_CHANGE: UpdateUserDto
  = {
    currentPassword: 'LETmeiN123$$$tP',
    email: 'changed@yahoo.com',
  };

// @ts-ignore
export const UPDATE_USER_DTO_SETUP_FORCE_PASSWORD_CHANGE: UpdateUserDto = {
  currentPassword: 'LETmeiN123$$$tP',
  forcePasswordChange: true,
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITH_NOT_COMPLEX_PASSWORD: UpdateUserDto = {
  currentPassword: 'LETmeiN123$$$tP',
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  password: 'Invalidpass1',
  passwordConfirmation: 'Invalidpass1',
  title: 'fake title',
};

export const UPDATE_USER_DTO_TEST_OBJ_WITH_MISSMATCHING_PASSWORDS: UpdateUserDto
  = {
    currentPassword: 'LETmeiN123$$$tP',
    email: 'updatedemail@yahoo.com',
    firstName: 'Updated',
    forcePasswordChange: false,
    lastName: 'Name',
    organization: 'Updated Org',
    password: 'ABCdefG456!@#pT',
    passwordConfirmation: 'defABCg789*(%Pt',
    role: 'user',
    title: 'updated title',
  };

// @ts-ignore
export const UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD: UpdateUserDto
  = {
    email: 'abc@yahoo.com',
    firstName: 'Test',
    lastName: 'Dummy',
    organization: 'Fake Org',
    password: 'ABCdefG456!@#pT',
    passwordConfirmation: 'ABCdefG456!@#pT',
    role: 'user',
    title: 'fake title',
  };

export const DELETE_USER_DTO_TEST_OBJ: DeleteUserDto = { password: 'LETmeiN123$$$tP' };

export const DELETE_FAILURE_USER_DTO_TEST_OBJ: DeleteUserDto = { password: 'Invalid_password' };

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
  TEST_USER_WITHOUT_FIRST_NAME,
);

export const USER_DTO_WITHOUT_LAST_NAME = new UserDto(
  TEST_USER_WITHOUT_LAST_NAME,
);

export const USER_DTO_WITHOUT_ORGANIZATION = new UserDto(
  TEST_USER_WITHOUT_ORGANIZATION,
);

export const USER_DTO_WITHOUT_TITLE = new UserDto(TEST_USER_WITHOUT_TITLE);

export const USER_DTO_ARRAY: UserDto[] = [USER_ONE_DTO, USER_TWO_DTO];

export const USERS_SERVICE_MOCK = {
  adminFindAllUsers: async (): Promise<User[]> => [],
  count: async (): Promise<number> => 1,
  create: async (_createUserDto: CreateUserDto): Promise<User> => new User(),
  findAllUsers: async (): Promise<User[]> => [],
  findByEmail: async (_email: string): Promise<User> => new User(),
  findById: async (_id: string): Promise<User> => new User(),
  findByPkBang: async (_identifier: Buffer | number | string | undefined): Promise<User> => new User(),
  findOneBang: async (_options: FindOptions | undefined): Promise<User> => new User(),
  remove: async (_userToDelete: User, _deleteUserDto: DeleteUserDto, _abac: MongoAbility): Promise<User> => new User(),
  update: async (_userToUpdate: User, _updateUserDto: UpdateUserDto, _abac: MongoAbility): Promise<User> => new User(),
  async updateLoginMetadata(_user: User): Promise<void> {
    return;
  },
  async updateUserSecret(_user: User): Promise<void> {
    return;
  },
};

/* eslint-enable @typescript-eslint/ban-ts-comment */
