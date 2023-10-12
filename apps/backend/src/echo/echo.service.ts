import {Injectable, NotFoundException} from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import {AnyProfile} from '../../../../libs/inspecjs/src/fileparse';
// import {ApiKey} from './apikey.model';
// import {APIKeyDto} from './dto/apikey.dto';

@Injectable()
export class EchoService {
  // TODO: Fix typing below to be profileJsonsKeyValueMapping

  private readonly profileJsons: {[key: string]: AnyProfile} =
    generateOverallJsonMapping();

  // TODO: Fix unknown below to be profileJsonsKeyValueMapping
  findControlByAttackPatternName(attackPatternName: string): {
    [key: string]: AnyProfile;
  } {
    console.log('Testing to see if this works');
    const profileContent = this.profileJsons;
    fs.writeFileSync('./testingObj.json', JSON.stringify(this.profileJsons));
    if (profileContent === null) {
      throw new NotFoundException("Couldn't find profile with given name");
    } else {
      return profileContent;
    }
  }
}

export const generateOverallJsonMapping = () => {
  let allProfiles: {[key: string]: AnyProfile} = {};
  const jsonsInDir = fs
    .readdirSync('./data/baselineProfiles')
    .filter((file) => path.extname(file) === '.json');

  jsonsInDir.forEach((file) => {
    const fileData = fs.readFileSync(
      path.join('./data/baselineProfiles', file)
    );
    const json = JSON.parse(fileData.toString());
    allProfiles[json.name] = json;
  });
  return allProfiles;
};

// type Operator = "AND" | "OR";

// interface KeyTerm {
//   term: string;
//   operator: Operator;
//   attributes: string[];
// }

// interface Attributes {
//   [attribute: string]: string;
// }

// interface Data {
//   [key: string]: Attributes;
// }

// function searchStrings(data: Data, keyTerms: KeyTerm[]): string[] {
//   const keys = Object.keys(data);

//   return keys.filter((key) => {
//     return keyTerms.reduce((acc: boolean, keyTerm: KeyTerm, index: number) => {
//       const isPresent = keyTerm.attributes.some((attribute) => {
//         const attributeValue = data[key][attribute];
//         return attributeValue
//           ? attributeValue.toLowerCase().includes(keyTerm.term.toLowerCase())
//           : false;
//       });

//       if (index === 0) {
//         return isPresent;
//       } else if (keyTerm.operator === "AND") {
//         return acc && isPresent;
//       } else {
//         return acc || isPresent;
//       }
//     }, false);
//   });
// }

// const data: Data = {
//   item1: {
//     title: "This is a test sentence",
//     description: "A simple test",
//   },
//   item2: {
//     title: "Another test sentence",
//     description: "Another simple test",
//   },
//   item3: {
//     title: "Yet another test",
//     description: "A different test",
//   },
//   item4: {
//     title: "Something completely different",
//     description: "Not a test",
//   },
// };

// const keyTerms: KeyTerm[] = [
//   { term: "test", operator: "OR", attributes: ["title", "description"] },
//   { term: "sentence", operator: "AND", attributes: ["title"] },
//   { term: "Another", operator: "OR", attributes: ["description"] },
// ];

// console.log(searchStrings(data, keyTerms));
