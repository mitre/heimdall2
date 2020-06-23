import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { UpdateUserDto } from '../src/users/dto/update-user.dto';
import { DeleteUserDto } from '../src/users/dto/delete-user.dto';
import { User } from '../src/users/user.model';
import { UserDto } from '../src/users/dto/user.dto';
/* eslint-disable @typescript-eslint/ban-ts-ignore */

export const ID = 7;

export const LOGIN_AUTHENTICATION = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const TEST_USER: User = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  role: 'user',
  title: 'fake title',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword: '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Fake Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
}

// @ts-ignore
export const ADMIN: User = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  role: 'admin',
  title: 'fake title',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword: '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Fake Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
}

// @ts-ignore
export const UPDATED_TEST_USER: User = {
  email: 'updatedemail@yahoo.com',
  firstName: 'Updated',
  lastName: 'Name',
  title: 'updated title',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword: '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Updated Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
}

// @ts-ignore
export const TEST_USER_WITHOUT_EMAIL: User = {
  firstName: 'Test',
  lastName: 'Dummy',
  role: 'user',
  title: 'fake title',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword: '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Fake Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
}

// @ts-ignore
export const TEST_USER_WITHOUT_FIRST_NAME: User = {
  email: 'abc@yahoo.com',
  lastName: 'Dummy',
  role: 'user',
  title: 'fake title',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword: '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Fake Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
}

// @ts-ignore
export const TEST_USER_WITHOUT_LAST_NAME: User = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  role: 'user',
  title: 'fake title',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword: '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Fake Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
}

// @ts-ignore
export const TEST_USER_WITHOUT_ORGANIZATION: User = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  role: 'user',
  title: 'fake title',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword: '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
}

// @ts-ignore
export const TEST_USER_WITHOUT_TITLE: User = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  role: 'user',
  // Encrypted password should match password, 'LETmeiN123$$$tP'
  encryptedPassword: '$2b$14$35oeK.h84XPIohhjTpwuV.NuFr/5oEzbg4mxLNppvfrA42ztXr2.O',
  organization: 'Fake Org',
  loginCount: 0,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
}

export const NULL_USER: User = null;

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
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'user'
};

export const CREATE_USER_DTO_ADMIN: CreateUserDto = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'admin'
};

export const CREATE_USER_DTO_TEST_OBJ_2: CreateUserDto = {
  email: 'def@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'user'
}

export const CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS: CreateUserDto = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'Password',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'user'
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_FIRST_NAME: CreateUserDto = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  lastName: 'Dummy',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'user'
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_LAST_NAME: CreateUserDto = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'user'
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ORGANIZATION: CreateUserDto = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  role: 'user'
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_TITLE: CreateUserDto = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  role: 'user'
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD: CreateUserDto = {
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'user'
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD: CreateUserDto = {
  email: 'NotAValidEmail',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'user'
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD: CreateUserDto = {
  email: 'abc@yahoo.com',
  passwordConfirmation: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'user'
};

// @ts-ignore
export const CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD: CreateUserDto = {
  email: 'abc@yahoo.com',
  password: 'LETmeiN123$$$tP',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  organization: 'Fake Org',
  role: 'user'
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
};

export const UPDATE_USER_DTO_TEST_OBJ: UpdateUserDto = {
  email: 'updatedemail@yahoo.com',
  firstName: 'Updated',
  lastName: 'Name',
  organization: 'Updated Org',
  title: 'updated title',
  role: 'admin',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  currentPassword: 'LETmeiN123$$$tP'
};

export const UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD: UpdateUserDto = {
  email: 'updatedemail@yahoo.com',
  firstName: 'Updated',
  lastName: 'Name',
  organization: 'Updated Org',
  title: 'updated title',
  role: 'admin',
  password: 'LETmeiN927!$@tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  currentPassword: 'ABCdefG456!@#pT'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_EMAIL: UpdateUserDto = {
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'admin',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITH_INVALID_EMAIL: UpdateUserDto = {
  email: 'NotAValidEmail',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'admin',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_FIRST_NAME: UpdateUserDto = {
  email: 'abc@yahoo.com',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'admin',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_LAST_NAME: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'admin',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_ORGANIZATION: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  title: 'fake title',
  role: 'admin',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_TITLE: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  role: 'admin',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_PASSWORD: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'admin',
  passwordConfirmation: 'LETmeiN123$$$tP',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS: UpdateUserDto = {
  email: 'updated@example.com',
  firstName: 'Updated',
  lastName: 'Updated',
  organization: 'Updated',
  title: 'Updated',
  role: 'admin',
  currentPassword: 'LETmeiN123$$$tP'
}

// @ts-ignore
export const UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'admin',
  currentPassword: 'invalid_password'
}

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_PASSWORD_CONFIRMATION: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'admin',
  password: 'LETmeiN123$$$tP',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_TEST_WITHOUT_ROLE: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
  currentPassword: 'LETmeiN123$$$tP'
};

export const UPDATE_FAILURE_USER_DTO_TEST_OBJ: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'admin',
  password: 'LETmeiN123$$$t',
  passwordConfirmation: 'LETmeiN123$$$tP',
  currentPassword: 'LETmeiN123$$$tP'
};

// @ts-ignore
export const UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD: UpdateUserDto = {
  email: 'abc@yahoo.com',
  firstName: 'Test',
  lastName: 'Dummy',
  organization: 'Fake Org',
  title: 'fake title',
  role: 'admin',
  password: 'LETmeiN123$$$tP',
  passwordConfirmation: 'LETmeiN123$$$tP',
};

export const DELETE_USER_DTO_TEST_OBJ: DeleteUserDto = {
  password: 'LETmeiN123$$$tP'
};

export const DELETE_FAILURE_USER_DTO_TEST_OBJ: DeleteUserDto = {
  password: 'LETmeiN123$$$t'
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

export const USER_DTO_WITHOUT_FIRST_NAME = new UserDto(TEST_USER_WITHOUT_FIRST_NAME);

export const USER_DTO_WITHOUT_LAST_NAME = new UserDto(TEST_USER_WITHOUT_LAST_NAME);

export const USER_DTO_WITHOUT_ORGANIZATION = new UserDto(TEST_USER_WITHOUT_ORGANIZATION);

export const USER_DTO_WITHOUT_TITLE = new UserDto(TEST_USER_WITHOUT_TITLE);

export const USER_DTO_ARRAY: UserDto[] = [USER_ONE_DTO, USER_TWO_DTO];
/* eslint-enable @typescript-eslint/ban-ts-ignore */
