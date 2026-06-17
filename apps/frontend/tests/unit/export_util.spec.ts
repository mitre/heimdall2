import {describe, expect, it} from 'vitest';
import {cleanUpFilename} from '@/utilities/export_util';

describe('cleanUpFilename', () => {
  describe('whitespace normalization', () => {
    it('replaces spaces with underscores', () => {
      expect(cleanUpFilename('AWS CIS Foundations Baseline', '.ckl')).toBe(
        'AWS_CIS_Foundations_Baseline.ckl'
      );
    });

    it('replaces multiple spaces with single underscore', () => {
      expect(cleanUpFilename('file  with   spaces', '.json')).toBe(
        'file_with_spaces.json'
      );
    });
  });

  describe('extension normalization — prevents double extensions', () => {
    it('strips .ckl before appending .ckl', () => {
      expect(cleanUpFilename('AWS-CIS-Foundations-Baseline.ckl', '.ckl')).toBe(
        'AWS-CIS-Foundations-Baseline.ckl'
      );
    });

    it('strips .csv before appending .csv', () => {
      expect(cleanUpFilename('report.csv', '.csv')).toBe('report.csv');
    });

    it('strips .json before appending .json', () => {
      expect(cleanUpFilename('evaluation.json', '.json')).toBe(
        'evaluation.json'
      );
    });

    it('strips .html before appending .html', () => {
      expect(cleanUpFilename('report.html', '.html')).toBe('report.html');
    });

    it('strips .xml before appending .xml (XCCDF re-export)', () => {
      expect(cleanUpFilename('results.xml', '.xml')).toBe('results.xml');
    });

    it('does NOT strip non-matching extensions', () => {
      expect(cleanUpFilename('evaluation.json', '.ckl')).toBe(
        'evaluation.json.ckl'
      );
    });

    it('handles case-insensitive extensions', () => {
      expect(cleanUpFilename('REPORT.CKL', '.ckl')).toBe('REPORT.ckl');
    });
  });

  describe('non-matching extensions are preserved', () => {
    it('preserves .txt extension when target is .json', () => {
      expect(cleanUpFilename('notes.txt', '.json')).toBe('notes.txt.json');
    });

    it('preserves .xml extension when target is .ckl', () => {
      expect(cleanUpFilename('results.xml', '.ckl')).toBe('results.xml.ckl');
    });
  });

  describe('special characters', () => {
    it('replaces colons with underscores (invalid on Windows)', () => {
      expect(cleanUpFilename('Report:2026-06-17:10:00', '.html')).toBe(
        'Report_2026-06-17_10_00.html'
      );
    });
  });

  describe('edge cases', () => {
    it('handles filenames with no extension', () => {
      expect(cleanUpFilename('plain-filename', '.json')).toBe(
        'plain-filename.json'
      );
    });

    it('handles filenames with dots that are not extensions', () => {
      expect(cleanUpFilename('v1.2.3-report', '.json')).toBe(
        'v1.2.3-report.json'
      );
    });

    it('handles empty target extension (no extension appended)', () => {
      expect(cleanUpFilename('filename.ckl', '')).toBe('filename.ckl');
    });

    it('handles no target extension (backward compat)', () => {
      expect(cleanUpFilename('file with spaces')).toBe('file_with_spaces');
    });
  });
});
