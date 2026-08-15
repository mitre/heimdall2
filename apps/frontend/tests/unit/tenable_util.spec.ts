import type {AuthInfo} from '@/utilities/tenable_util';
import {
  INCORRECT_CREDENTIALS_MSG,
  LOGIN_TIMEOUT_MSG,
  TenableUtil
} from '@/utilities/tenable_util';
import JSZip from 'jszip';
import {describe, expect, it, vi} from 'vitest';

// The wording the 400 branch used to substitute for the backend's own message.
// Hoisted to module scope so it is compiled once (e18e/prefer-static-regex).
const CSP_WORDING = /Content Security Policy/;

const config: AuthInfo = {
  accesskey: 'test-access-key',
  secretkey: 'test-secret-key',
  host_url: 'https://tenable.example.org:443'
};

describe('TenableUtil', () => {
  it('configures its axios instance with the login timeout', () => {
    const util = new TenableUtil(config);
    expect(util.axios_instance.defaults.timeout).toBe(60_000);
  });

  it('resolves true when lite-mode login succeeds', async () => {
    const util = new TenableUtil(config);
    util.axios_instance.get = vi
      .fn()
      .mockResolvedValue({status: 200, data: {}});
    await expect(util.loginToTenable()).resolves.toBe(true);
  });

  it('rejects with an Error carrying the credential message on a 403', async () => {
    const util = new TenableUtil(config);
    util.axios_instance.get = vi.fn().mockRejectedValue({
      response: {data: {error_code: 74}},
      status: 403
    });
    await expect(util.loginToTenable()).rejects.toBeInstanceOf(Error);
    await expect(util.loginToTenable()).rejects.toThrowError(
      INCORRECT_CREDENTIALS_MSG
    );
  });

  it('maps a timed-out request to the login-timeout message', async () => {
    const util = new TenableUtil(config);
    util.axios_instance.get = vi.fn().mockRejectedValue({
      code: 'ECONNABORTED',
      message: 'timeout of 60000ms exceeded',
      request: {}
    });
    await expect(util.loginToTenable()).rejects.toBeInstanceOf(Error);
    await expect(util.loginToTenable()).rejects.toThrowError(
      LOGIN_TIMEOUT_MSG
    );
  });

  it('rejects with the server-provided message when server-mode login is unsuccessful', async () => {
    const util = new TenableUtil(config);
    util.isServer = true;
    util.axios_instance.post = vi
      .fn()
      .mockResolvedValue({data: {success: false, message: 'backend says no'}});
    await expect(util.loginToTenable()).rejects.toBeInstanceOf(Error);
    await expect(util.loginToTenable()).rejects.toThrowError(
      'backend says no'
    );
  });

  // The backend refuses an off-allowlist host with a coded 400
  // (HOST_NOT_ALLOWED, heimdall2-86f6.6). Before this test the 400 branch
  // recognised only INVALID_HOST_URL, so every other coded rejection fell
  // through to the Content Security Policy explanation — telling the operator
  // their browser policy blocked a request the SERVER had refused. Asserting
  // the absence of the CSP wording is what makes this test discriminating: the
  // exact-message assertion alone would not say which explanation was wrong.
  it('surfaces a server-side host rejection instead of blaming the browser CSP', async () => {
    const util = new TenableUtil(config);
    util.isServer = true;
    util.axios_instance.post = vi.fn().mockRejectedValue({
      code: 'ERR_BAD_REQUEST',
      response: {
        data: {
          code: 'HOST_NOT_ALLOWED',
          message: 'The requested Tenable host is not permitted by this server',
          status: 400
        }
      },
      status: 400
    });
    await expect(util.loginToTenable()).rejects.toThrowError(
      'The requested Tenable host is not permitted by this server'
    );
    await expect(util.loginToTenable()).rejects.not.toThrowError(CSP_WORDING);
  });

  it('unzips the first file of a downloaded scan result', async () => {
    const util = new TenableUtil(config);
    const zip = new JSZip();
    zip.file('9213.nessus', '<NessusClientData_v2/>');
    const buffer = await zip.generateAsync({type: 'arraybuffer'});
    util.axios_instance.post = vi.fn().mockResolvedValue({data: buffer});
    await expect(util.getVulnerabilities('9213')).resolves.toBe(
      '<NessusClientData_v2/>'
    );
  });

  it('rejects when the downloaded zip is empty', async () => {
    const util = new TenableUtil(config);
    const zip = new JSZip();
    const buffer = await zip.generateAsync({type: 'arraybuffer'});
    util.axios_instance.post = vi.fn().mockResolvedValue({data: buffer});
    await expect(util.getVulnerabilities('9213')).rejects.toThrowError(
      'ZIP file is empty.'
    );
  });
});
