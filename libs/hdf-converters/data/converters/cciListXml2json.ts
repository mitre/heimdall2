import fs from 'fs';
import * as _ from 'lodash';
import xml2js from 'xml2js';

// Documentation is located at https://github.com/mitre/heimdall2/wiki/Control-Correlation-Identifier-(CCI)-Converter.
const parser = new xml2js.Parser();
const pathToInfile = process.argv[2];
const pathToCci2NistOutfile = process.argv[3];
const pathToCci2DefinitionsOutfile = process.argv[4];

// XML Structure after conversion
export interface ICCIList {
  cci_list: {
    cci_items: {
      cci_item: {
        $: Record<string, string>;
        references?: {
          reference: {
            $: Record<string, string>;
          }[];
        }[];
        definition: string[];
      }[];
    }[];
  };
}

if (!pathToInfile || !pathToCci2NistOutfile || !pathToCci2DefinitionsOutfile) {
  console.error(`You must provide the path to the input and two output files.`);
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
          // These store our CCI->NIST names and definitions mappings
          const nists: Record<string, string> = {};
          const definitions: Record<string, string> = {};
          // For all CCI items
          converted.cci_list.cci_items[0].cci_item.forEach((cciItem) => {
            // Get the latest reference
            const newestReference = _.maxBy(
              cciItem.references?.[0].reference,
              (item) => _.get(item, '$.version')
            );
            if (newestReference) {
              nists[cciItem.$.id] = newestReference.$.index;
              definitions[cciItem.$.id] = cciItem.definition[0];
            } else {
              console.error(`No NIST Controls found for ${cciItem.$.id}`);
            }
          });
          fs.writeFileSync(pathToCci2NistOutfile, JSON.stringify(nists));
          fs.writeFileSync(
            pathToCci2DefinitionsOutfile,
            JSON.stringify(definitions)
          );
        }
      });
    }
  });
}
