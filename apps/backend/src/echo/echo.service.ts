import {Injectable, NotFoundException} from '@nestjs/common';
import fs from 'fs';
import {AnyProfile} from 'inspecjs';
import path from 'path';
import {searchOverallJsonMapping} from './utils/complexSearch';
import {ttpToKeywordMapping} from './utils/ttpToKeywordsMapping';
// import {ApiKey} from './apikey.model';
// import {APIKeyDto} from './dto/apikey.dto';

@Injectable()
export class EchoService {
  private readonly profileJsons: {[key: string]: AnyProfile} =
    generateOverallJsonMapping();
  // private readonly ttpToKeywordMapping = ttpToKeywordMapping;
  // private readonly githubMapping = githubMapping;

  findControlByAttackPatternName(attackPatternName: string): {
    [key: string]: {[key: string]: string};
  } {
    const profileContent = this.profileJsons;

    if (profileContent === null) {
      throw new NotFoundException(
        "Couldn't find profile with given name or no relevant controls exist"
      );
    } else {
      return searchOverallJsonMapping(
        ttpToKeywordMapping[attackPatternName],
        this.profileJsons
      );
    }
  }
}

export const generateOverallJsonMapping = () => {
  let allProfiles: {[key: string]: AnyProfile} = {};
  const jsonsInDir = fs
    .readdirSync('./data/baselineProfiles/')
    .filter((file) => path.extname(file) === '.json');

  jsonsInDir.forEach((file) => {
    const fileData = fs.readFileSync(
      path.join('./data/baselineProfiles/', file)
    );
    const json = JSON.parse(fileData.toString());
    json['github_url'] =
      'https://github.com/mitre/' + file.replace('.json', '');
    allProfiles[json.name] = json;
  });
  return allProfiles;
};
