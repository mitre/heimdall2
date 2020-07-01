import { Policy } from "../policy.model";
import { AbacAttributes } from "./abac-attributes.dto";

export class PolicyDto {
  readonly role: string;
  readonly actions: string;
  readonly targets: string;
  readonly attributes?: AbacAttributes;

  constructor(policy: Policy) {
    this.role = policy.role;
    this.actions = policy.actions;
    this.targets = policy.targets;
    if (!(policy.attributes == null)) {
      this.attributes = new AbacAttributes(policy.attributes);
    }
  }
}
