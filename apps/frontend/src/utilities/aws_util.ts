import {GetObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {
  GetCallerIdentityCommand,
  GetSessionTokenCommand,
  STSClient
} from '@aws-sdk/client-sts';

export const AUTH_DURATION = 8 * 60 * 60; // 8 hours

/** represents the auth credentials for aws stuff */
export interface AuthCreds {
  accessKeyId: string;
  secretAccessKey: string;
  // Optional: absent when logging in directly with long-lived keys (no STS session).
  sessionToken?: string;
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
  /** Custom S3-compatible endpoint URL. Undefined/empty means use the default AWS endpoints. */
  endpoint?: string;
}

/** Builds the optional endpoint config for an S3 client.
 * When a custom endpoint is supplied (e.g. MinIO, Ceph, on-prem S3) we also force
 * path-style addressing, since non-AWS servers rarely support virtual-host buckets.
 * When omitted, returns an empty object so the SDK falls back to the AWS defaults.
 */
export function endpointConfig(endpoint?: string): {
  endpoint?: string;
  forcePathStyle?: boolean;
} {
  return endpoint ? {endpoint, forcePathStyle: true} : {};
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
  const client = new S3Client({
    credentials: auth.creds,
    region: auth.region,
    ...endpointConfig(auth.endpoint)
  });
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

/** Builds an Auth directly from long-lived credentials, without calling STS.
 * Useful for S3-compatible servers (MinIO, Ceph, on-prem) that don't implement
 * the STS GetSessionToken / GetCallerIdentity APIs. The credentials are used as-is
 * and no temporary session token is issued.
 */
export function getDirectAuth(
  accessToken: string,
  secretKey: string,
  region: string,
  endpoint?: string
): Auth {
  return {
    creds: {
      accessKeyId: accessToken,
      secretAccessKey: secretKey
    },
    info: {
      user_account: 'N/A',
      user_arn: 'Direct credentials (STS skipped)',
      probable_user_mfa_device: null,
      user_id: 'N/A'
    },
    from_mfa: false,
    region: region,
    endpoint: endpoint || undefined
  };
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
  mfaInfo?: MFAInfo,
  endpoint?: string
): Promise<Auth | null> {
  // Instanciate STS with our base and secret token.
  // A custom endpoint targets any S3-compatible server; omitting it uses AWS.
  const client = new STSClient({
    credentials: {
      accessKeyId: accessToken,
      secretAccessKey: secretKey
    },
    region: region,
    // STS has no concept of path-style addressing, so only forward the endpoint.
    ...(endpoint ? {endpoint} : {})
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
    region: region,
    endpoint: endpoint || undefined
  };
}

function isAWSError(e: unknown): e is {name: string; message: string} {
  return (
    typeof e === 'object' &&
    e !== null &&
    'name' in e &&
    'message' in e &&
    typeof e.name === 'string' &&
    typeof e.message === 'string'
  );
}

/** Generates human readable versions of common AWS error codes.
 * The error class is untyped since they've distributed their error/exception classes all over.
 * If the code is not recognized, coughs it back up as an erroname
 */
export function transcribeError(
  error: {name: string; message: string} | unknown
): string {
  if (isAWSError(error)) {
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
  } else {
    return `Unknown error: ${error instanceof Error ? error.message : JSON.stringify(error, null, 2)}`;
  }
}
