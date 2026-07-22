export const REVIEW_TAG = 'heimdall:review';
export const REVIEW_ROOT_TAG_PREFIX = 'heimdall:review-root:';
export const REVIEW_PARENT_TAG_PREFIX = 'heimdall:review-parent:';

const REVIEW_FILENAME_SUFFIX = /\s+- review \d{4}-\d{2}-\d{2} \d{2}-\d{2}$/u;

export function reviewTimestamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

export function reviewCopyFilename(filename: string, date = new Date()): string {
  return `${filename.replace(
    REVIEW_FILENAME_SUFFIX,
    ''
  )} - review ${reviewTimestamp(date)}`;
}

export function reviewRootId(tagValues: string[]): string | undefined {
  return tagValues
    .find((tag) => tag.startsWith(REVIEW_ROOT_TAG_PREFIX))
    ?.slice(REVIEW_ROOT_TAG_PREFIX.length);
}

export function reviewedCopyTags(
  sourceTagValues: string[],
  sourceDatabaseId: string
): string[] {
  const rootId = reviewRootId(sourceTagValues) ?? sourceDatabaseId;
  const reviewTags = [
    REVIEW_TAG,
    `${REVIEW_ROOT_TAG_PREFIX}${rootId}`,
    `${REVIEW_PARENT_TAG_PREFIX}${sourceDatabaseId}`
  ];

  return [
    ...new Set(
      sourceTagValues
        .filter(
          (tag) =>
            tag !== REVIEW_TAG &&
            !tag.startsWith(REVIEW_ROOT_TAG_PREFIX) &&
            !tag.startsWith(REVIEW_PARENT_TAG_PREFIX)
        )
        .concat(reviewTags)
    )
  ];
}
