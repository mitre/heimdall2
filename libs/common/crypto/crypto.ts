import {compare, hash} from 'bcryptjs';
import {getRandomValues, pbkdf2Sync} from 'crypto';

export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  getRandomValues(bytes);
  return bytes;
}

export function asHexString(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

// a hashed and salted password with the salt and other information prepended to the password
// for bcrypt it is of the form `$hashalgorithmidentifierconsistingoftwocharacters$seedroundsnumberpaddedtotwodigits$22charactersofsaltandthenthepassword`
// for us it'll be of the form `32bytesofsaltandthenthepassword`
export async function hashAndSaltPassword(
  password: string,
  useBCrypt = false
): Promise<string> {
  if (useBCrypt) {
    return hash(password, 14);
  }

  const salt = randomBytes(32); // SP 800-132 says to use at least 16 bytes for PBKDF

  const hashedAndSaltedPassword = pbkdf2Sync(
    password,
    salt,
    600000, // integer; OWASP recommends 600k for PBKDF2-HMAC-SHA256
    64,
    'sha256'
  );

  return `${Buffer.from(salt).toString(
    'hex'
  )}${hashedAndSaltedPassword.toString('hex')}`;
}

export async function comparePassword(
  password: string,
  encryptedPassword: string,
  useBCrypt = false
): Promise<boolean> {
  if (useBCrypt) {
    return compare(password, encryptedPassword);
  }

  const salt = encryptedPassword.slice(0, 64);
  const encrypted = encryptedPassword.slice(64);

  const hashedAndSaltedPassword = pbkdf2Sync(
    password,
    Buffer.from(salt, 'hex'),
    600000, // integer; OWASP recommends 600k for PBKDF2-HMAC-SHA256
    64,
    'sha256'
  );

  return encrypted === hashedAndSaltedPassword.toString('hex');
}
