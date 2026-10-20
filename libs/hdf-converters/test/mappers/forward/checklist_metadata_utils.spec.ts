import {describe, expect, it} from 'vitest';
import {
  Asset,
  Assettype,
  Role,
  Techarea
} from '../../../src/ckl-mapper/checklistJsonix';
import {validateChecklistAssetMetadata} from '../../../src/ckl-mapper/checklist-metadata-utils';

const newline = String.fromCharCode(10);
const tab = String.fromCharCode(9);

const validAsset: Asset = {
  assettype: Assettype.Computing,
  hostfqdn: 'host.example.com',
  hostip: '10.0.0.1',
  hostmac: '00:11:22:33:44:55',
  hostname: 'host',
  role: Role.Workstation,
  targetkey: null,
  techarea: Techarea.ApplicationReview,
  webdbinstance: null,
  webdbsite: null,
  webordatabase: false
};

const validateWithHostMac = (hostmac: string) =>
  validateChecklistAssetMetadata({...validAsset, hostmac});

const validateWithHostIp = (hostip: string) =>
  validateChecklistAssetMetadata({...validAsset, hostip});

describe('Checklist asset metadata validation', () => {
  describe('hostmac', () => {
    it('accepts a single MAC address', () => {
      expect(validateWithHostMac('00:11:22:33:44:55').ok).toBe(true);
    });

    it('accepts MAC addresses separated by comma, space, or newline', () => {
      expect(validateWithHostMac('00:11:22:33:44:55,66:77:88:99:aa:bb').ok).toBe(
        true
      );
      expect(validateWithHostMac('00:11:22:33:44:55 66:77:88:99:aa:bb').ok).toBe(
        true
      );
      expect(
        validateWithHostMac(`00:11:22:33:44:55${newline}66:77:88:99:aa:bb`).ok
      ).toBe(true);
    });

    it('accepts MAC addresses with prepended or trailing whitespace', () => {
      expect(validateWithHostMac(' 00:11:22:33:44:55').ok).toBe(true);
      expect(validateWithHostMac('00:11:22:33:44:55 ').ok).toBe(true);
      expect(validateWithHostMac('  00:11:22:33:44:55  ').ok).toBe(true);
      expect(validateWithHostMac(' 00:11:22:33:44:55, 66:77:88:99:aa:bb ').ok).toBe(
        true
      );
    });

    it('accepts whitespace-only input as empty', () => {
      expect(validateWithHostMac('   ').ok).toBe(true);
      expect(validateWithHostMac(`${tab}${newline} `).ok).toBe(true);
    });

    it('rejects a malformed MAC address', () => {
      expect(validateWithHostMac('not-a-mac').ok).toBe(false);
    });

    it('rejects a list containing a malformed MAC address', () => {
      expect(validateWithHostMac('00:11:22:33:44:55, zz').ok).toBe(false);
    });
  });

  describe('hostip', () => {
    it('accepts a single IP address', () => {
      expect(validateWithHostIp('10.0.0.1').ok).toBe(true);
    });

    it('accepts IP addresses separated by comma, space, or newline', () => {
      expect(validateWithHostIp('10.0.0.1,10.0.0.2').ok).toBe(true);
      expect(validateWithHostIp('10.0.0.1 10.0.0.2').ok).toBe(true);
      expect(validateWithHostIp(`10.0.0.1${newline}10.0.0.2`).ok).toBe(true);
    });

    it('accepts IP addresses with prepended or trailing whitespace', () => {
      expect(validateWithHostIp(' 10.0.0.1').ok).toBe(true);
      expect(validateWithHostIp('10.0.0.1 ').ok).toBe(true);
      expect(validateWithHostIp(' 10.0.0.1, 10.0.0.2 ').ok).toBe(true);
    });

    it('accepts whitespace-only input as empty', () => {
      expect(validateWithHostIp('   ').ok).toBe(true);
    });

    it('rejects a malformed IP address', () => {
      expect(validateWithHostIp('not-an-ip').ok).toBe(false);
    });

    it('rejects a list containing a malformed IP address', () => {
      expect(validateWithHostIp('10.0.0.1, zz').ok).toBe(false);
    });
  });
});
