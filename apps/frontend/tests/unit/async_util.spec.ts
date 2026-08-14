import {readFileAsync} from '@/utilities/async_util';
import {describe, expect, it} from 'vitest';

describe('readFileAsync', () => {
  // The read used to be a FileReader wrapped in a hand-rolled promise, whose
  // result was typed loosely enough to stringify to '[object ArrayBuffer]'.
  // Blob#text can only ever produce the file's text.
  it('resolves with the text of the file', async () => {
    const file = new File(['{"hello":"world"}'], 'result.json', {
      type: 'application/json'
    });
    await expect(readFileAsync(file)).resolves.toBe('{"hello":"world"}');
  });

  it('resolves with an empty string for an empty file', async () => {
    await expect(readFileAsync(new File([], 'empty.json'))).resolves.toBe('');
  });
});
