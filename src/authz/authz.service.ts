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
      console.log('Role: ' + policyDto.role);
      console.log('Action: ' + policyDto.actions);
      console.log('Resource: ' + policyDto.targets + '\n');
    }
  }

  async can(subject, action, resource): Promise<boolean> {
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
    return answer.granted;
  }
}
