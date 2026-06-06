import {describe, it, expect} from 'vitest';
import {readFileSync} from 'fs';
import {resolve} from 'path';

describe('PII logging removal', () => {
  it('OIDC strategy does not log full JSON profile', () => {
    const source = readFileSync(
      resolve(__dirname, '../authn/oidc.strategy.ts'), 'utf-8',
    );
    expect(source).not.toContain('JSON.stringify(uiProfile');
    expect(source).not.toContain('JSON.stringify(profile');
  });

  it('Okta strategy does not log full JSON profile', () => {
    const source = readFileSync(
      resolve(__dirname, '../authn/okta.strategy.ts'), 'utf-8',
    );
    expect(source).not.toContain('JSON.stringify(profile');
  });

  it('authn controller does not log req.session JSON', () => {
    const source = readFileSync(
      resolve(__dirname, '../authn/authn.controller.ts'), 'utf-8',
    );
    expect(source).not.toContain('JSON.stringify(req.session');
  });
});
