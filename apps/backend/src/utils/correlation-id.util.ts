import {v4 as uuidv4} from 'uuid';

/**
 * Generates a secure correlation ID using UUID v4
 * This provides cryptographically strong random values suitable for correlation IDs
 * @param prefix Optional prefix to add to the correlation ID
 * @returns A correlation ID string
 */
export function generateCorrelationId(prefix?: string): string {
  const id = uuidv4();
  return prefix ? `${prefix}_${id}` : id;
}
