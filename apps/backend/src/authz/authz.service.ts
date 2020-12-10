import {Injectable} from '@nestjs/common';
import {CaslAbilityFactory} from '../casl/casl-ability.factory';

@Injectable()
export class AuthzService {
  abac: CaslAbilityFactory;

  constructor() {
    this.abac = new CaslAbilityFactory();
  }
}
