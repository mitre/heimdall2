import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {SimpleAbac} from 'simple-abac';
import {Policy} from './policy.model';
import {PolicyDto} from './dto/policy.dto';

@Injectable()
export class AuthzService {
  abac: SimpleAbac;

  constructor(
    @InjectModel(Policy)
    private policyModel: typeof Policy
  ) {
    this.abac = new SimpleAbac();
    this.loadAllPolicies();
  }

  private async loadAllPolicies() {
    const policies = await this.policyModel.findAll<Policy>();
    for (const policy of policies) {
      const policyDto = new PolicyDto(policy);
      this.abac.allow(policyDto);
      console.log('Loaded Policy!');
      console.log('\tRole: ' + policyDto.role);
      console.log('\tAction: ' + policyDto.actions);
      console.log('\tResource: ' + policyDto.targets + '\n');
    }
  }

  async can(subject: any, action: string, resource: string): Promise<boolean> {
    if (subject.role == 'admin') {
      return true;
    }
    resource = resource.split('/')[1];
    const answer = await this.abac.can(
      {role: subject.role},
      action,
      resource,
      {}
    );
    console.log(answer);
    return answer.granted;
  }
}
