import { describe, expect, it } from 'vitest';
import { BurpSuiteResults } from '../../src/burpsuite-mapper';
import { FortifyMapper, FortifyResults } from '../../src/fortify-mapper';
import { NessusResults } from '../../src/nessus-mapper';
import { ZapResults } from '../../src/zap-mapper';

describe('parseHtml DI pattern', () => {
  describe('FortifyResults', () => {
    it('init() sets this.parseHtml via buildParseHtmlFunc', async () => {
      const results = new FortifyResults('<xml/>');
      expect(results.parseHtml).toBeUndefined();

      await (results as any).init();

      expect(results.parseHtml).toBeDefined();
      expect(typeof results.parseHtml).toBe('function');
      expect(results.parseHtml('<b>bold</b>')).toBe('bold');
    });
  });

  describe('BurpSuiteResults', () => {
    it('init() sets this.parseHtml', async () => {
      const results = new BurpSuiteResults('<xml/>');
      expect(results.parseHtml).toBeUndefined();

      await (results as any).init();

      expect(results.parseHtml).toBeDefined();
      expect(typeof results.parseHtml).toBe('function');
      expect(results.parseHtml('<p>text</p>')).toBe('text');
    });
  });

  describe('NessusResults', () => {
    it('init() sets this.parseHtml AND policyName/version are instance properties', async () => {
      const results = new NessusResults('<xml/>');
      expect(results.parseHtml).toBeUndefined();
      expect(results.policyName).toBe('');
      expect(results.version).toBe('');

      await (results as any).init();

      expect(results.parseHtml).toBeDefined();
      expect(typeof results.parseHtml).toBe('function');
      expect(results.parseHtml('<em>emphasis</em>')).toBe('emphasis');
    });
  });

  describe('ZapResults', () => {
    it('init() sets this.parseHtml', async () => {
      const results = new ZapResults('{}');
      expect(results.parseHtml).toBeUndefined();

      await (results as any).init();

      expect(results.parseHtml).toBeDefined();
      expect(typeof results.parseHtml).toBe('function');
      expect(results.parseHtml('<a href="#">link</a>')).toBe('link');
    });
  });

  describe('FortifyMapper receives parseHtml', () => {
    it('stores parseHtml as constructor param', async () => {
      const results = new FortifyResults('<xml/>');
      await (results as any).init();
      const parseHtmlFn = results.parseHtml;

      const mapper = new FortifyMapper('<xml/>', false, parseHtmlFn);

      expect(mapper.parseHtml).toBe(parseHtmlFn);
      expect(mapper.parseHtml('<div>content</div>')).toBe('content');
    });
  });
});
