import {Injectable} from '@nestjs/common';
import {SimpleAbac} from 'simple-abac';
import {DEFAULT_POLICIES} from './policies';

@Injectable()
export class AuthzService {
  abac: SimpleAbac;

  constructor() {
    this.abac = new SimpleAbac();
    this.loadDefaultPolicies();
  }

  private async loadDefaultPolicies() {
    for (const policy of DEFAULT_POLICIES) {
      this.abac.allow(policy);
      console.log('Loaded Policy!');
      console.log('\tRole: ' + policy.role);
      console.log('\tAction: ' + policy.actions);
      console.log('\tResource: ' + policy.targets);
      console.log('\tCondition: ' + policy.condition?.toString() + '\n');
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
