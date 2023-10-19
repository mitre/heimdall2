import {Injectable, NotFoundException} from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import {searchOverallJsonMapping, SearchTerm} from './utils/complexSearch';
// import {ApiKey} from './apikey.model';
// import {APIKeyDto} from './dto/apikey.dto';

@Injectable()
export class EchoService {
  private readonly profileJsons: {[key: string]: unknown} =
    generateOverallJsonMapping();
  private readonly ttpMapping = mapping;

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
        this.ttpMapping[attackPatternName],
        this.profileJsons
      );
    }
  }
}

export const generateOverallJsonMapping = () => {
  let allProfiles: {[key: string]: unknown} = {};
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

export const mapping: {
  [key: string]: SearchTerm[];
} = {
  'T1548.003': [
    {term: 'timestamp_timeout', type: 'OR'},
    {term: 'tty_tickets', type: 'OR'},
    {term: 'sudoers', type: 'AND'}
  ],
  T1134: [
    {term: 'token', type: 'AND'},
    {term: 'rights', type: 'AND'},
    {term: 'create', type: 'AND'}
  ],
  'T1543.003': [
    {term: 'drivers', type: 'AND'},
    {term: 'windows', type: 'AND'},
    {term: 'enforce', type: 'AND'}
  ],
  'T1547.009': [{term: 'Create symbolic link', type: 'OR'}]
};
