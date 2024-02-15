import {GetObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {
  GetCallerIdentityCommand,
  GetSessionTokenCommand,
  STSClient
} from '@aws-sdk/client-sts';
import axios from 'axios';
import { saveAs } from 'file-saver';

export const AUTH_DURATION = 8 * 60 * 60; // 8 hours

/** represents the auth credentials for aws stuff */
export interface AuthCreds {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
}

/** represents the information of the current used */
export interface AuthInfo {
  expiration?: Date;
  user_account: string;
  user_arn: string;
  probable_user_mfa_device: string | null; // Null implies it could not be deduced
  user_id: string;
}

/** bundles the above two */
export interface Auth {
  creds: AuthCreds;
  info: AuthInfo;
  from_mfa: boolean;
  region: string;
}

/** Fetches the described S3 file using the given creds.
 * Yields the string contents on success
 * Yields the AWS error on failure
 */
export async function fetchS3File(
  auth: Auth,
  fileKey: string,
  bucketName: string
): Promise<string> {
  // Fetch it from s3, and promise to submit it to be loaded afterwards
  const client = new S3Client({credentials: auth.creds, region: auth.region});
  const response = await client.send(
    new GetObjectCommand({
      Key: fileKey,
      Bucket: bucketName
    })
  );
  if (!response.Body) {
    throw new Error('Fetching S3 file failed');
  }
  return response.Body.transformToString();
}

/** Represents the bundle of parameters required for creating a session key using MFA */
export interface MFAInfo {
  SerialNumber: string | null; // If null, use deduced token
  TokenCode: string;
}

/** Attempts to deduce the virtual mfa device serial code from the provided */
export function deriveMFASerial(userAccessToken: string): string | null {
  return userAccessToken ? userAccessToken.replace(':user', ':mfa') : null;
}

/** Attempts to retrieve an aws temporary session using the given information.
 * Yields the session info on success.
 * Yields the AWS error on failure.
 */
export async function getSessionToken(
  accessToken: string,
  secretKey: string,
  region: string,
  duration: number,
  mfaInfo?: MFAInfo
): Promise<Auth | null> {
  // Instanciate STS with our base and secret token
  const client = new STSClient({
    credentials: {
      accessKeyId: accessToken,
      secretAccessKey: secretKey
    },
    region: region
  });

  // Get the user info
  const wipInfo: Partial<AuthInfo> = {};
  const responseCallerId = await client.send(new GetCallerIdentityCommand({}));
  wipInfo.user_account = responseCallerId.Account;
  wipInfo.user_arn = responseCallerId.Arn || 'Unknown Resource Name';
  wipInfo.user_id = responseCallerId.UserId;
  // Guess at mfa
  wipInfo.probable_user_mfa_device = deriveMFASerial(wipInfo.user_arn);

  // It's built - mark as such
  const info = wipInfo as AuthInfo;

  // Make our request to be the role
  let responseSessionToken;
  if (mfaInfo) {
    mfaInfo.SerialNumber ??= info.probable_user_mfa_device;
    if (mfaInfo.SerialNumber) {
      responseSessionToken = await client.send(
        new GetSessionTokenCommand({
          DurationSeconds: duration,
          SerialNumber: mfaInfo.SerialNumber,
          TokenCode: mfaInfo.TokenCode
        })
      );
    }
  } else {
    responseSessionToken = await client.send(new GetSessionTokenCommand({}));
  }

  // Handle the response. On Success, save the creds. On error, throw that stuff back!
  if (!responseSessionToken?.Credentials) {
    throw new Error('AWS assume role attempt failed');
  }
  if (!responseSessionToken?.Credentials?.AccessKeyId) {
    throw new Error('AWS assume role attempt failed - no AccessKeyId');
  }
  if (!responseSessionToken?.Credentials?.SecretAccessKey) {
    throw new Error('AWS assume role attempt failed - no SecretAccessKey');
  }
  if (!responseSessionToken?.Credentials?.SessionToken) {
    throw new Error('AWS assume role attempt failed - no SessionToken');
  }
  const creds: AuthCreds = {
    accessKeyId: responseSessionToken.Credentials.AccessKeyId,
    secretAccessKey: responseSessionToken.Credentials.SecretAccessKey,
    sessionToken: responseSessionToken.Credentials.SessionToken
  };
  return {
    creds,
    info,
    from_mfa: !!mfaInfo,
    region: region
  };
}

/** Generates human readable versions of common AWS error codes.
 * The error class is untyped since they've distributed their error/exception classes all over.
 * If the code is not recognized, coughs it back up as an erroname
 */
export function transcribeError(error: {
  name: string;
  message: string;
}): string {
  const {name, message} = error;
  switch (name) {
    case 'TokenRefreshRequired':
    case 'ExpiredToken':
      return 'Authorization expired. Please log back in.';
    case 'InvalidAccessKeyId':
      return 'Provided access key is invalid.';
    case 'AccessDenied':
      return `Access denied. This likely means that your account does not have access to the specified bucket, or that it requires MFA authentication.`;
    case 'AccountProblem':
      return `Account problem detected: ${message}`;
    case 'CredentialsNotSupported':
      return 'Provided credentials not supported.';
    case 'InvalidBucketName':
      return 'Invalid bucket name! Please ensure you spelled it correctly.';
    case 'NetworkingError':
      return 'Networking error. This may be because the provided bucket name does not exist. Please ensure you have spelled it correctly.';
    case 'InvalidBucketState':
      return 'Invalid bucket state! Contact your AWS administrator.';
    case 'ValidationError':
      return `Further validation required: ${message}`;
    case 'SignatureDoesNotMatch':
      return 'The provided secret token does not match access token. Please ensure that it is correct.';
    case 'InvalidToken':
      return 'Your session token has expired. Please log back in and try again.';
    case 'InvalidClientTokenId':
      return 'The provided access token is invalid. Please ensure that it is correct.';
    default:
      return `Unknown error ${name}. Message: ${message}`;
  }
}

export async function s3ListFiles(prefix: string): Promise<any> {
    return axios.get<S3.ListObjectsV2Output | undefined>('/autharti', { params: { prefix: prefix } });
}

export function s3DownloadFile(key: string) {
  const fileName = key.split('/').pop();
  axios.get('/autharti/download', { params: {key: key}}).then(response => {
    console.log("response", response);
    const data = Buffer.from(response.data, 'hex');
    console.log("buffer data", data);
    saveAs(new Blob([data], {type: 'application/zip'}), fileName);
  });
}
