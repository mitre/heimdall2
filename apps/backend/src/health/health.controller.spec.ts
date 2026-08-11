import type { INestApplication } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import {
  HealthCheckError,
  SequelizeHealthIndicator,
  TerminusModule,
} from '@nestjs/terminus';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { version as backendVersion } from '../../package.json';
import { ApiKey } from '../apikeys/apikey.model';
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
import { HealthService } from '../health/health.service';
import { User } from '../users/user.model';
import { HealthController } from './health.controller';

// §17 disclosure boundary: none of these may ever appear on a probe surface.
const MIGRATION_STATE_PATTERN = /bcrypt|fips|passwordHashWriteEnabled|pbkdf2/v;

describe('HealthController Unit Tests', () => {
  let app: INestApplication;
  let baseUrl: string;
  let healthController: HealthController;
  let configService: ConfigService;
  let databaseService: DatabaseService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [HealthController],
      imports: [
        ConfigModule,
        CryptoModule,
        DatabaseModule,
        SequelizeModule.forFeature([
          ApiKey,
          Evaluation,
          EvaluationTag,
          Group,
          GroupEvaluation,
          GroupUser,
          User,
        ]),
        TerminusModule,
      ],
      providers: [DatabaseService, HealthService],
    }).compile();

    healthController = module.get<HealthController>(HealthController);
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

  describe('GET /health (unauthenticated liveness)', () => {
    it('returns {status, version} ONLY — no fips, write-gate, or count fields (ADR-006 §17 disclosure boundary)', () => {
      expect(healthController.getHealth()).toEqual({
        status: 'ok',
        version: backendVersion,
      });
    });

    it('serves the liveness shape over HTTP with NO Authorization header (unauthenticated surface)', async () => {
      const response = await fetch(`${baseUrl}/health`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        status: 'ok',
        version: backendVersion,
      });
    });
  });

  describe('GET /health/ready (unauthenticated Terminus readiness probe)', () => {
    it('returns the standard Terminus envelope with the database up, with NO Authorization header', async () => {
      const response = await fetch(`${baseUrl}/health/ready`);
      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(body).toEqual({
        details: { database: { status: 'up' } },
        error: {},
        info: { database: { status: 'up' } },
        status: 'ok',
      });
      // §17 disclosure boundary, asserted explicitly per the AC: no
      // migration state anywhere in the probe response (the exact toEqual
      // above already pins the key set; this sweeps nested values too).
      expect(JSON.stringify(body)).not.toMatch(MIGRATION_STATE_PATTERN);
    });

    it('sends Cache-Control: no-cache, no-store, must-revalidate — probe responses must never be cached (@HealthCheck)', async () => {
      const response = await fetch(`${baseUrl}/health/ready`);
      expect(response.headers.get('cache-control')).toBe(
        'no-cache, no-store, must-revalidate',
      );
    });

    it('returns 503 with the Terminus error envelope when the DB check fails (same handler path, failing indicator)', async () => {
      // The real controller, HealthCheckService, and 503 mapping — only the
      // indicator (the piece that talks to the DB) is substituted with one
      // that fails the way a dead connection does. Deliberately NO
      // DatabaseModule here: a second Sequelize registration rebinds the
      // shared model classes and poisons the main module's cleanup, and the
      // ready route never touches HealthService.
      const failingModule = await Test.createTestingModule({
        controllers: [HealthController],
        imports: [ConfigModule, TerminusModule],
        providers: [
          { provide: HealthService, useValue: {} },
        ],
      })
        .overrideProvider(SequelizeHealthIndicator)
        .useValue({
          pingCheck: () => {
            throw new HealthCheckError('sequelize ping failed', { database: { status: 'down' } });
          },
        })
        .compile();
      const failingApp = failingModule.createNestApplication();
      await failingApp.init();
      await failingApp.listen(0);
      const failingAddress = failingApp.getHttpServer().address();
      if (failingAddress === null || typeof failingAddress !== 'object') {
        throw new TypeError('expected the failing test server to bind a port');
      }

      try {
        const response = await fetch(
          `http://127.0.0.1:${String(failingAddress.port)}/health/ready`,
        );
        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({
          details: { database: { status: 'down' } },
          error: { database: { status: 'down' } },
          info: {},
          status: 'error',
        });
      } finally {
        await failingApp.close();
      }
    });
  });
});
