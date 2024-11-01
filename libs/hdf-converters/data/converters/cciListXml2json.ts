import fs from 'fs';
import * as _ from 'lodash';
import xml2js from 'xml2js';

// Documentation is located at https://github.com/mitre/heimdall2/wiki/Control-Correlation-Identifier-(CCI)-Converter.
const parser = new xml2js.Parser();
const pathToInfile = process.argv[2];
const pathToCci2NistOutfile = process.argv[3];
const pathToCci2DefinitionsOutfile = process.argv[4];
const pathToNist2CciOutfile = process.argv[5];

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

if (
  !pathToInfile ||
  !pathToCci2NistOutfile ||
  !pathToCci2DefinitionsOutfile ||
  !pathToNist2CciOutfile
) {
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
          // These store our CCI->NIST names, CCI->definitions, and NIST->CCI mappings
          const nists: Record<string, string> = {};
          const definitions: Record<string, string> = {};
          const ccis: Record<string, string[]> = {};

          // For all CCI items
          for (const cciItem of converted.cci_list.cci_items[0].cci_item) {
            // Get the latest reference
            const newestReference = _.maxBy(
              cciItem.references?.[0].reference,
              (item) => _.get(item, '$.version')
            );
            if (newestReference) {
              nists[cciItem.$.id] = newestReference.$.index;
              if (ccis[newestReference.$.index] === undefined) {
                ccis[newestReference.$.index] = [cciItem.$.id];
              } else {
                ccis[newestReference.$.index].push(cciItem.$.id);
              }
              definitions[cciItem.$.id] = cciItem.definition[0];
            } else {
              console.error(`No NIST Controls found for ${cciItem.$.id}`);
            }
          }
          fs.writeFileSync(
            pathToCci2NistOutfile,
            JSON.stringify(nists, null, 2)
          );
          fs.writeFileSync(
            pathToCci2DefinitionsOutfile,
            JSON.stringify(definitions, null, 2)
          );
          fs.writeFileSync(
            pathToNist2CciOutfile,
            JSON.stringify(ccis, null, 2)
          );
        }
      });
    }
  });
}
