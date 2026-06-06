import {describe, expect, it} from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {globSync} from 'glob';
import {CaslAbilityFactory} from '../casl/casl-ability.factory';

describe('guard swap verification', () => {
  it('app.module.ts has disableGlobalAuthGuard set to false', () => {
    const appModuleSource = fs.readFileSync(
      path.join(__dirname, '..', 'app.module.ts'),
      'utf8'
    );
    expect(appModuleSource).toContain('disableGlobalAuthGuard: false');
    expect(appModuleSource).not.toContain('disableGlobalAuthGuard: true');
  });

  it('no controllers import Passport guards', () => {
    const srcDir = path.join(__dirname, '..');
    const controllerFiles = globSync('**/*.controller.ts', {cwd: srcDir});

    for (const file of controllerFiles) {
      const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
      expect(content).not.toContain(
        "from '../guards/jwt-auth.guard'"
      );
      expect(content).not.toContain(
        "from '../guards/api-key-or-jwt-auth.guard'"
      );
      expect(content).not.toContain(
        "from '../guards/local-auth.guard'"
      );
      expect(content).not.toContain(
        "from '../guards/implicit-allow-jwt-auth.guard'"
      );
    }
  });

  it('CaslAbilityFactory accepts user with id and role (not Sequelize User)', () => {
    const factory = new CaslAbilityFactory();
    const ability = factory.createForUser({
      id: 'test-user-id',
      role: 'user',
    });
    expect(ability).toBeDefined();
    expect(ability.can('read', 'all')).toBe(false);
  });

  it('CaslAbilityFactory gives admin manage all', () => {
    const factory = new CaslAbilityFactory();
    const ability = factory.createForUser({
      id: 'admin-id',
      role: 'admin',
    });
    expect(ability.can('manage', 'all')).toBe(true);
  });
});
