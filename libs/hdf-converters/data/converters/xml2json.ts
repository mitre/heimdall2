import fs from 'fs';
import * as _ from 'lodash';
import xml2js from 'xml2js';

const parser = new xml2js.Parser();
const pathToInfile = process.argv[2];
const pathToOutfile = process.argv[3];

// XML Structure after conversion
export interface ICCIList {
  cci_list: {
    cci_items: {
      cci_item: {
        $: Record<string, string>;
        references: {
          reference: {
            $: Record<string, string>;
          }[];
        }[];
      }[];
    }[];
  };
}

if (!pathToInfile || !pathToOutfile) {
  console.error(`You must provide the path to both an input and ouput file.`);
} else {
  fs.readFile(pathToInfile, function (readFileError, data) {
    if (readFileError) {
      console.error(`Failed to read ${pathToInfile}: ${readFileError}`);
    } else {
      // Parse XML to JS Object
      parser.parseString(data, (parseFileError: any, converted: ICCIList) => {
        if (parseFileError) {
          console.error(`Failed to parse ${pathToInfile}: ${parseFileError}`);
        } else {
          // Stores our CCI->NIST mapping
          const result: Record<string, string> = {};
          // For all cci items
          converted.cci_list.cci_items[0].cci_item.forEach((cciItem) => {
            // Get the latest reference
            const newestReference = _.maxBy(
              cciItem.references[0].reference,
              (item) => _.get(item, '$.version')
            );
            if (newestReference) {
              result[cciItem.$.id] = newestReference.$.index;
            } else {
              console.error(`No NIST Controls found for ${cciItem.$.id}`);
            }
          });
          fs.writeFileSync(pathToOutfile, JSON.stringify(result));
        }
      });
    }
  });
}
