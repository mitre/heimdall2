import { ForbiddenError } from '@casl/ability';
import type { INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SequelizeModule } from '@nestjs/sequelize';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { sign } from 'jsonwebtoken';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { GROUPS_SERVICE_MOCK } from '../../test/constants/groups-test.constant';
import { ApiKey } from '../apikeys/apikey.model';
import { JwtStrategy } from '../authn/jwt.strategy';
import { AuthzModule } from '../authz/authz.module';
import { CaslExceptionFilter } from '../casl/casl-exception.filter';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { CryptoModule } from '../crypto/crypto.module';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { EvaluationTag } from '../evaluation-tags/evaluation-tag.model';
import { Evaluation } from '../evaluations/evaluation.model';
import { GroupEvaluation } from '../group-evaluations/group-evaluation.model';
import { GroupUser } from '../group-users/group-user.model';
import { Group } from '../groups/group.model';
import { GroupsService } from '../groups/groups.service';
import { HealthModule } from '../health/health.module';
import { User } from '../users/user.model';
import { UsersService } from '../users/users.service';
import { AdminController } from './admin.controller';
import { AdminModule } from './admin.module';

// Prefix-shaped literal for the §17 count queries — never verified as a
// credential, only matched against LIKE '$pbkdf2-%'.
const PBKDF2_SHAPED_HASH = '$pbkdf2-sha512$i=600000$c2FsdHNhbHQ$aGFzaGhhc2g';
const USER_JWT_SECRET = 'admin-spec-session-secret';

function createRoleUser(role: string): Promise<User> {
  return User.create({
    creationMethod: 'local',
    email: `admin-spec-${role}@example.com`,
    encryptedPassword: PBKDF2_SHAPED_HASH,
    jwtSecret: USER_JWT_SECRET,
    role,
  });
}

describe('AdminController Unit Tests', () => {
  let app: INestApplication;
  let baseUrl: string;
  let adminController: AdminController;
  let configService: ConfigService;
  let databaseService: DatabaseService;
  let module: TestingModule;

  // Mirrors AuthnService.login: same payload shape, same JWT_SECRET +
  // per-user jwtSecret concatenation the JwtStrategy re-derives per request.
  function signSessionToken(user: User): string {
    return sign(
      {
        email: user.email,
        forcePasswordChange: false,
        role: user.role,
        sub: user.id,
      },
      String(configService.get('JWT_SECRET')) + user.jwtSecret,
      { expiresIn: '600s' },
    );
  }

  beforeAll(async () => {
    // The REAL AdminModule and HealthModule, not root-mounted controllers:
    // each controller resolves its dependencies inside its own module,
    // exactly as in app.module — a missing module import fails HERE, not
    // only at live boot (found live: the original root-mounted harness
    // masked AdminModule's missing ConfigModule import). Both modules
    // mounted keeps the old-path-404 assertion honest.
    module = await Test.createTestingModule({
      imports: [
        AdminModule,
        AuthzModule,
        ConfigModule,
        CryptoModule,
        DatabaseModule,
        HealthModule,
        SequelizeModule.forFeature([
          ApiKey,
          Evaluation,
          EvaluationTag,
          Group,
          GroupEvaluation,
          GroupUser,
          User,
        ]),
      ],
      providers: [
        DatabaseService,
        JwtStrategy,
        UsersService,
        { provide: GroupsService, useValue: GROUPS_SERVICE_MOCK },
        // The real app maps CASL ForbiddenError -> 403 through this filter.
        { provide: APP_FILTER, useClass: CaslExceptionFilter },
      ],
    }).compile();

    adminController = module.get<AdminController>(AdminController, { strict: false });
    configService = module.get<ConfigService>(ConfigService);
    databaseService = module.get<DatabaseService>(DatabaseService);

    app = module.createNestApplication();
    await app.init();
    // Port 0 = ephemeral, so this never collides with a dev server.
    await app.listen(0);
    const address = app.getHttpServer().address();
    if (address === null || typeof address !== 'object') {
      throw new TypeError('expected the test server to bind a TCP port');
    }
    baseUrl = `http://127.0.0.1:${String(address.port)}`;
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
    configService.set('FIPS_MODE', undefined);
  });

  afterAll(async () => {
    // Order matters: app.close() tears down the Nest app INCLUDING its
    // Sequelize connection, so the cleanup query has to run first.
    await databaseService.cleanAll();
    await app.close();
  });

  describe('GET /admin/migration-status (authenticated migration report)', () => {
    it('serves the migration detail to an admin JWT over HTTP', async () => {
      const admin = await createRoleUser('admin');

      const response = await fetch(`${baseUrl}/admin/migration-status`, { headers: { Authorization: `Bearer ${signSessionToken(admin)}` } });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        bcryptRemaining: { apiKeys: 0, users: 0 },
        fips: false,
        fipsModeAsserted: false,
        oldestUnmigratedLogin: null,
        passwordHashWriteEnabled: true,
        pbkdf2Migrated: { apiKeys: 0, users: 1 },
      });
    });

    it('refuses HTTP requests without a JWT — 401 from JwtAuthGuard', async () => {
      const response = await fetch(`${baseUrl}/admin/migration-status`);
      expect(response.status).toBe(401);
    });

    it('refuses a non-admin JWT over HTTP with 403 (CASL -> CaslExceptionFilter)', async () => {
      const basicUser = await createRoleUser('user');

      const response = await fetch(`${baseUrl}/admin/migration-status`, { headers: { Authorization: `Bearer ${signSessionToken(basicUser)}` } });
      expect(response.status).toBe(403);
    });

    it('rejects a non-admin authenticated user with ForbiddenError (CASL admin check, direct call)', async () => {
      const basicUser = await createRoleUser('user');

      await expect(
        adminController.getMigrationStatus({ user: basicUser }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('the old path is gone (ratified rename, 2026-08-10)', () => {
    it('GET /health/details returns 404 with the health routes mounted', async () => {
      const admin = await createRoleUser('admin');

      const response = await fetch(`${baseUrl}/health/details`, { headers: { Authorization: `Bearer ${signSessionToken(admin)}` } });
      expect(response.status).toBe(404);
    });

    it('the probe-safe health surface still serves — /health 200 unauthenticated', async () => {
      const response = await fetch(`${baseUrl}/health`);
      expect(response.status).toBe(200);
    });
  });
});
