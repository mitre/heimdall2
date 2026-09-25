export type Credentials = { email: string; password: string };

export type TestUser = Credentials & {
  creationMethod: 'local';
  firstName: string;
  lastName: string;
  organization: string;
  passwordConfirmation: string;
  role: 'user';
  title: string;
};

export const user: TestUser = {
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

export const updatedUser = {
  ...user,
  email: 'updatedemail@yahoo.com',
  firstName: 'Updated',
  lastName: 'Name',
  organization: 'Updated Org',
  password: 'ABCdefG456!@#pT',
  passwordConfirmation: 'ABCdefG456!@#pT',
  title: 'updated title',
};

export const sampleName = 'Acme Overlay Example';
export const ldap = { password: 'fry', username: 'fry' };
export const splunk = {
  hostname: 'https://localhost:8089',
  password: 'Valid_password!',
  username: 'admin',
};
export const s3 = {
  accessKey: 'myaccesskey',
  bucket: 'mybucket',
  endpoint: 'http://127.0.0.1:7070',
  filename: 'nessus-hdf.json',
  secretKey: 'mysecretkey',
};
