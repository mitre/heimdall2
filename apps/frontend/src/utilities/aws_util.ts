import S3 from 'aws-sdk/clients/s3';
import STS from 'aws-sdk/clients/sts';
import {AWSError} from 'aws-sdk/lib/error';
import {PromiseResult} from 'aws-sdk/lib/request';

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
}

/** Fetches the described S3 file using the given creds.
 * Yields the string contents on success
 * Yields the AWS error on failure
 */
export async function fetch_s3_file(
  creds: AuthCreds,
  file_key: string,
  bucket_name: string
): Promise<string> {
  // Fetch it from s3, and promise to submit it to be loaded afterwards
  return new S3({...creds})
    .getObject({
      Key: file_key,
      Bucket: bucket_name
    })
    .promise()
    .then((success) => {
      const content: string = new TextDecoder('utf-8').decode(
        success.Body! as Uint8Array
      );
      return content;
    });
}

export async function list_buckets(creds: AuthCreds) {
  return new S3({...creds})
    .listBuckets()
    .promise()
    .then(
      () => {
        throw Error('Not implemented');
      },
      () => {
        throw Error('Not implemented');
      }
    );

  // */
}

/** Represents the bundle of parameters required for creating a session key using MFA */
export interface MFA_Info {
  SerialNumber: string | null; // If null, use deduced token
  TokenCode: string;
}

/** Attempts to deduce the virtual mfa device serial code from the provided */
export function derive_mfa_serial(user_access_token: string): string | null {
  if (user_access_token) {
    return user_access_token.replace(':user', ':mfa');
  } else {
    return null;
  }
}

/** Attempts to retrieve an aws temporary session using the given information.
 * Yields the session info on success.
 * Yields the AWS error on failure.
 */
export async function get_session_token(
  access_token: string,
  secret_key: string,
  duration: number,
  mfa_info?: MFA_Info
): Promise<Auth> {
  // Instanciate STS with our base and secret token
  const sts = new STS({
    accessKeyId: access_token,
    secretAccessKey: secret_key
  });

  // Get the user info
  const wip_info: Partial<AuthInfo> = {};
  await sts
    .getCallerIdentity({})
    .promise()
    .then((success) => {
      wip_info.user_account = success.Account!;
      wip_info.user_arn = success.Arn!;
      wip_info.user_id = success.UserId;
      // Guess at mfa
      wip_info.probable_user_mfa_device = derive_mfa_serial(wip_info.user_arn!);
    });

  // It's built - mark as such
  const info = wip_info as AuthInfo;

  // Make our request to be the role
  let result: Promise<PromiseResult<STS.GetSessionTokenResponse, AWSError>>;
  if (mfa_info) {
    mfa_info.SerialNumber =
      mfa_info.SerialNumber || info.probable_user_mfa_device!; // We cannot get to this stage if
    result = sts
      .getSessionToken({
        DurationSeconds: duration,
        SerialNumber: mfa_info.SerialNumber,
        TokenCode: mfa_info.TokenCode
      })
      .promise();
  } else {
    // Not strictly necessary but why not!
    result = sts.getSessionToken().promise();
  }

  // Handle the response. On Success, save the creds. On error, throw that stuff back!
  return result.then((success) => {
    const creds: AuthCreds = {
      accessKeyId: success.Credentials!.AccessKeyId,
      secretAccessKey: success.Credentials!.SecretAccessKey,
      sessionToken: success.Credentials!.SessionToken
    };
    return {
      creds,
      info,
      from_mfa: !!mfa_info
    };
  });
}

/** Generates human readable versions of common AWS error codes.
 * If the code is not recognized, coughs it back up as an error
 */
export function transcribe_error(error: AWSError): string {
  // Unpack
  const {code, message} = error;

  // Get what we're supposed to do with it
  switch (code) {
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
      return `Unkown error ${code}. Message: ${message}`;
  }
}
