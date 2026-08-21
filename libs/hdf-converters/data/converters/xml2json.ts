import fs from 'fs';
import _ from 'lodash';
import { Parser } from 'xml2js';

const parser = new Parser();
const pathToInfile = process.argv[2];
const pathToOutfile = process.argv[3];

// XML Structure after conversion
export interface ICCIList {
  cci_list: {
    cci_items: {
      cci_item: {
        $: Record<string, string>;
        references: { reference: { $: Record<string, string> }[] }[];
      }[];
    }[];
  };
}

if (!pathToInfile || !pathToOutfile) {
  console.error('You must provide the path to both an input and ouput file.');
} else {
  fs.readFile(pathToInfile, function (readFileError, data) { // eslint-disable-line security/detect-non-literal-fs-filename -- CLI tool reads user-specified XML input
    if (readFileError) {
      console.error(`Failed to read ${pathToInfile}: ${readFileError}`);
    } else {
      parser.parseString(data, (parseFileError: any, converted: ICCIList) => {
        if (parseFileError) {
          console.error(`Failed to parse ${pathToInfile}: ${parseFileError}`);
        } else {
          const result: Record<string, string> = {};
          const cciItems = converted.cci_list.cci_items[0].cci_item;
          for (const cciItem of cciItems) {
            const newestReference = _.maxBy(
              cciItem.references[0].reference,
              item => _.get(item, '$.version'),
            );
            if (newestReference) {
              result[cciItem.$.id] = newestReference.$.index;
            } else {
              console.error(`No NIST Controls found for ${cciItem.$.id}`);
            }
          }
          fs.writeFileSync(pathToOutfile, JSON.stringify(result)); // eslint-disable-line security/detect-non-literal-fs-filename -- CLI tool writes user-specified output
        }
      });
    }
  });
}
