import fs from 'fs';
import {describe, expect, it} from 'vitest';
import {FileExportTypes, FromHDFToHTMLMapper} from '../../../index';
import {omitHTMLStyleTag} from '../../utils';

describe('HTML Results Reverse Mapper', () => {
  it('Successfully converts RHEL7 HDF into HTML', async () => {
    const inputData = fs.readFileSync(
      'sample_jsons/html_reverse_mapper/sample_input_report/rhel7-results.json',
      {encoding: 'utf-8'}
    );

    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'rhel7-results.json', fileID: '1'}],
      FileExportTypes.Administrator
    );

    const converted = await mapper.toHTML();

    // fs.writeFileSync(
    //   'sample_jsons/html_reverse_mapper/rhel7.html',
    //   converted
    // );

    const expected = fs.readFileSync(
      'sample_jsons/html_reverse_mapper/rhel7.html',
      'utf-8'
    );

    expect(omitHTMLStyleTag(converted)).toEqual(omitHTMLStyleTag(expected));
  });

  it('Successfully converts SonarQube HDF into HTML', async () => {
    const inputData = fs.readFileSync(
      'sample_jsons/html_reverse_mapper/sample_input_report/sonarqube-hdf.json',
      {encoding: 'utf-8'}
    );

    const mapper = new FromHDFToHTMLMapper(
      [{data: inputData, fileName: 'sonarqube-hdf.json', fileID: '1'}],
      FileExportTypes.Administrator
    );

    const converted = await mapper.toHTML();

    // fs.writeFileSync(
    //   'sample_jsons/html_reverse_mapper/sonarqube.html',
    //   converted
    // );

    const expected = fs.readFileSync(
      'sample_jsons/html_reverse_mapper/sonarqube.html',
      'utf-8'
    );

    expect(omitHTMLStyleTag(converted)).toEqual(omitHTMLStyleTag(expected));
  });
});
