import {
  ISimpleAbacAbilities,
  SimpleAbacCondition
} from 'simple-abac/dist/interfaces';
import {Policy} from '../policy.model';
import {AbacAttributes} from './abac-attributes.dto';

export class PolicyDto implements ISimpleAbacAbilities {
  readonly role: string;
  readonly actions: string;
  readonly targets: string;
  readonly attributes?: AbacAttributes;
  readonly condition?: SimpleAbacCondition;

  constructor(policy: Policy) {
    this.role = policy.role;
    this.actions = policy.actions;
    this.targets = policy.targets;
    if (policy.attributes != undefined) {
      this.attributes = new AbacAttributes(policy.attributes);
    }
    if (policy.condition != undefined) {
      this.condition = new Function(
        'userId',
        'targetOptions',
        policy.condition
      ) as SimpleAbacCondition;
    }
  }
}
