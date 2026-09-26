import {
  REVIEW_PARENT_TAG_PREFIX,
  REVIEW_ROOT_TAG_PREFIX,
  REVIEW_TAG,
  reviewedCopyTags,
  reviewCopyFilename,
  reviewRootId,
  reviewTimestamp
} from '@/utilities/review_copy_util';
import {describe, expect, it} from 'vitest';

describe('review copy utilities', () => {
  const reviewDate = new Date(2026, 5, 17, 9, 5);

  it('formats reviewed copy timestamps for filenames', () => {
    expect(reviewTimestamp(reviewDate)).toBe('2026-06-17 09-05');
  });

  it('appends a reviewed copy suffix to the source filename', () => {
    expect(reviewCopyFilename('Acme Overlay Example', reviewDate)).toBe(
      'Acme Overlay Example - review 2026-06-17 09-05'
    );
  });

  it('replaces an existing reviewed copy suffix instead of stacking suffixes', () => {
    expect(
      reviewCopyFilename(
        'Acme Overlay Example - review 2026-06-16 14-30',
        reviewDate
      )
    ).toBe('Acme Overlay Example - review 2026-06-17 09-05');
  });

  it('finds the root evaluation id from existing review tags', () => {
    expect(
      reviewRootId([
        REVIEW_TAG,
        `${REVIEW_ROOT_TAG_PREFIX}123`,
        `${REVIEW_PARENT_TAG_PREFIX}456`
      ])
    ).toBe('123');
  });

  it('creates review tags for a first-generation reviewed copy', () => {
    expect(reviewedCopyTags(['team:red'], '123')).toEqual([
      'team:red',
      REVIEW_TAG,
      `${REVIEW_ROOT_TAG_PREFIX}123`,
      `${REVIEW_PARENT_TAG_PREFIX}123`
    ]);
  });

  it('preserves the original root and updates the parent for later generations', () => {
    expect(
      reviewedCopyTags(
        [
          'team:red',
          REVIEW_TAG,
          `${REVIEW_ROOT_TAG_PREFIX}123`,
          `${REVIEW_PARENT_TAG_PREFIX}123`
        ],
        '456'
      )
    ).toEqual([
      'team:red',
      REVIEW_TAG,
      `${REVIEW_ROOT_TAG_PREFIX}123`,
      `${REVIEW_PARENT_TAG_PREFIX}456`
    ]);
  });
});
