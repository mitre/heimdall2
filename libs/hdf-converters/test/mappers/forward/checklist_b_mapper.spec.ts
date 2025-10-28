import fs from 'fs';
import {ChecklistResults} from '../../../src/ckl-mapper/checklist-mapper';
import {omitVersions} from '../../utils';
import {InvalidChecklistMetadataException} from '../../../src/ckl-mapper/checklist-metadata-utils';

// To write the output to a file for visual inspection, follow the example below:
// fs.writeFileSync(
//   'sample_jsons/checklist_mapper/FILENAME.json',
//   JSON.stringify(mapper.toHdf(), null, 2)
// );

const readFile = (path: fs.PathOrFileDescriptor) =>
  fs.readFileSync(path, {encoding: 'utf-8'});
const parseJsonFile = (path: fs.PathOrFileDescriptor) =>
  JSON.parse(readFile(path));


describe('Checklist Mapper Tests', () => {
  it('Successfully creates intermediate checklist object', () => {
    // const mapper = new ChecklistResults(
    //   readFile(
    //     'sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.cklb'
    //   )
    // );
    const file_contents = readFile('sample_jsons/checklist_mapper/sample_input_report/RHEL8V1R3.cklb')
    console.log(file_contents)
    // const jsonixData = mapper.getJsonix();
    // const results = mapper.toIntermediateObject(jsonixData);
    // expect(results).toEqual(
    //   parseJsonFile(
    //     'sample_jsons/checklist_mapper/checklist_intermediate_object.json'
    //   )
    // );
  });
});
