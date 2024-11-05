import fs from 'fs';
import * as _ from 'lodash';
import xml2js from 'xml2js';
import {parseArgs} from 'node:util';

// Documentation is located at https://github.com/mitre/heimdall2/wiki/Control-Correlation-Identifier-(CCI)-Converter.
const parser = new xml2js.Parser();

const options = {
  input: {
    type: 'string',
    short: 'i'
  },
  cci2nist: {
    type: 'string',
    short: 'n'
  },
  cci2definitions: {
    type: 'string',
    short: 'd'
  },
  nist2cci: {
    type: 'string',
    short: 'c'
  }
} as const;

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

// Check that we're not doing `npm test`; it will look for the arguments to the input and output files.
const scriptIsCalled = process.argv[1].includes('cciListXml2json');

if (scriptIsCalled) {
  const {values} = parseArgs({options});

  const pathToInfile = values.input;
  const pathToCci2NistOutfile = values.cci2nist;
  const pathToCci2DefinitionsOutfile = values.cci2definitions;
  const pathToNist2CciOutfile = values.nist2cci;

  if (
    !pathToInfile ||
    !pathToCci2NistOutfile ||
    !pathToCci2DefinitionsOutfile ||
    !pathToNist2CciOutfile
  ) {
    console.error(
      'You must provide the path to the input and three output files.'
    );
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
              JSON.stringify(unflatten(ccis), null, 2)
            );
          }
        });
      }
    });
  }
}

export const CCIS_KEY = 'ccis';
export const DELIMITER = ' ';

type Leaf = {
  [CCIS_KEY]?: string[];
};

type Branch = Leaf & {
  [key: string]: Branch | string[] | undefined;
};

export type Trie = {
  [key: string]: Branch;
};

export function removeParentheses(key: string): string {
  return key.replace(/[()]/g, '');
}

function unflatten(fullNistPathToListOfCcis: Record<string, string[]>): Trie {
  const result = {};
  const keys = _.keys(fullNistPathToListOfCcis);
  for (const key of keys) {
    const path = key.split(DELIMITER).map(removeParentheses);
    path.push(CCIS_KEY);
    const value = fullNistPathToListOfCcis[key];
    _.setWith(result, path, value, Object);
  }
  return result;
}
