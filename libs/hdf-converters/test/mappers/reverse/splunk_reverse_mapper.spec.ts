import fs from 'fs';
import {describe, it} from 'vitest';
import {FromHDFToSplunkMapper} from '../../../src/converters-from-hdf/splunk/reverse-splunk-mapper';

const SPLUNK_HOST = process.env.SPLUNK_HOST ?? '127.0.0.1';
const SPLUNK_PORT = Number(process.env.SPLUNK_PORT ?? 8089);

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Describe Splunk Reverse Mapper', () => {
  it('Successfully converts HDF into Splunk', async ({ skip }) => {
    const inputData = JSON.parse(
      fs.readFileSync(
        'sample_jsons/asff_reverse_mapper/sample_input_report/rhel7-results.json',
        {encoding: 'utf-8'}
      )
    );

    try {
      await new FromHDFToSplunkMapper(inputData).toSplunk(
        {
          host: SPLUNK_HOST,
          username: process.env.SPLUNK_USERNAME ?? 'admin',
          password: process.env.SPLUNK_PASSWORD ?? 'Valid_password!',
          index: process.env.SPLUNK_INDEX ?? 'main',
          scheme: (process.env.SPLUNK_SCHEME as 'http' | 'https') ?? 'http'
        },
        'rhel7-results.json'
      );
    } catch (error: any) {
      if (error?.cause?.code === 'ECONNREFUSED' || error?.cause?.code === 'ECONNRESET') {
        skip(`Splunk not available at ${SPLUNK_HOST}:${SPLUNK_PORT}`);
      }
      throw error;
    }
  });
});
