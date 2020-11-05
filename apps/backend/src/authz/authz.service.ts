import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {SimpleAbac} from 'simple-abac';
import {PolicyDto} from './dto/policy.dto';
import {Policy} from './policy.model';

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
      console.log('\tResource: ' + policyDto.targets);
      console.log('\tCondition: ' + policyDto.condition?.toString() + '\n');
    }
  }

  async can(
    subject: {role: string},
    action: string,
    resource: string
  ): Promise<boolean> {
    if (subject.role === 'admin') {
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
