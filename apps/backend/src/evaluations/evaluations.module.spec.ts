import type { DynamicModule, ExecutionContext, INestApplication, Type } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MulterModule } from '@nestjs/platform-express';
import { MULTER_MODULE_OPTIONS } from '@nestjs/platform-express/multer/files.constants';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { Test } from '@nestjs/testing';
import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthzService } from '../authz/authz.service';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { GroupsService } from '../groups/groups.service';
import { APIKeyOrJwtAuthGuard } from '../guards/api-key-or-jwt-auth.guard';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsModule } from './evaluations.module';
import { EvaluationsService } from './evaluations.service';

// Exercise the production upload route and Multer configuration without a database.
const imports = new Reflector().get<(DynamicModule | Type)[]>(
  'imports',
  EvaluationsModule,
);
const multerRegistration = imports.find(
  (entry): entry is DynamicModule =>
    'module' in entry && entry.module === MulterModule,
);
const MiB = 1024 ** 2;

describe('EvaluationsModule upload limits', () => {
  let app: INestApplication | undefined;
  const createEvaluation = vi.fn(
    (evaluation: Parameters<EvaluationsService['create']>[0]) =>
      Promise.resolve({ ...evaluation, id: '1' }),
  );

  afterEach(async () => {
    await app?.close();
    app = undefined;
    createEvaluation.mockClear();
    vi.restoreAllMocks();
  });

  async function createApp(
    values: Record<string, string | undefined>,
  ): Promise<INestApplication> {
    if (!multerRegistration) {
      throw new Error('EvaluationsModule must configure Multer');
    }
    const configService = new ConfigService();
    const configValues = new Map(Object.entries(values));
    vi.spyOn(configService, 'get').mockImplementation(key => configValues.get(key));
    vi.spyOn(configService, 'getExternalUrl').mockReturnValue('https://heimdall.test');
    const module = await Test.createTestingModule({
      controllers: [EvaluationsController],
      imports: [ConfigModule, multerRegistration],
      providers: [
        AuthzService,
        { provide: EvaluationsService, useValue: { create: createEvaluation } },
        { provide: GroupsService, useValue: {} },
      ],
    })
      .overrideProvider(ConfigService)
      .useValue(configService)
      .overrideGuard(APIKeyOrJwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const request = context.switchToHttp().getRequest<{ user: { id: string; role: string } }>();
          request.user = { id: '1', role: 'user' };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    return app;
  }

  function expectSavedFiles(fileSizes: number[]) {
    expect(
      createEvaluation.mock.calls.map(([evaluation]) => {
        const data = evaluation.data as { originalResultsData: string };
        return Buffer.byteLength(data.originalResultsData);
      }),
    ).toEqual(fileSizes);
  }

  async function upload(
    values: Record<string, string | undefined>,
    fileSizes: number[],
    fieldSize = 0,
  ) {
    const testApp = await createApp(values);
    await testApp.listen(0, '127.0.0.1');

    const boundary = 'heimdall-upload-test';
    const fields = {
      evaluationTags: 'a'.repeat(fieldSize),
      filename: 'evaluation.txt',
      public: 'false',
    };
    const form = Buffer.concat([
      ...fileSizes.flatMap(size => [
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="data"; filename="evaluation.txt"\r\nContent-Type: text/plain\r\n\r\n`,
        ),
        Buffer.alloc(size, 'a'),
        Buffer.from('\r\n'),
      ]),
      ...Object.entries(fields).map(([name, value]) => Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
      )),
      Buffer.from(`--${boundary}--\r\n`),
    ]);
    return axios.post(`${await testApp.getUrl()}/evaluations`, form, {
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      maxBodyLength: Infinity,
      proxy: false,
      validateStatus: () => true,
    });
  }

  it('passes the configured limits to Multer', async () => {
    const testApp = await createApp({
      MAX_FILE_UPLOAD_SIZE: '0.5',
      MAX_FILES_PER_UPLOAD: '2',
      MAX_UPLOAD_FIELD_SIZE: '0.25',
    });
    const options = testApp.get<MulterOptions>(MULTER_MODULE_OPTIONS);
    expect(options.limits).toEqual({
      fieldSize: 262_144,
      files: 2,
      fileSize: 524_288,
    });
  });

  it.each(['MAX_FILE_UPLOAD_SIZE', 'MAX_FILES_PER_UPLOAD', 'MAX_UPLOAD_FIELD_SIZE'])(
    'rejects invalid %s during module initialization',
    async (key) => {
      await expect(createApp({ [key]: 'invalid' })).rejects.toThrow(key);
    },
  );

  it.each([
    { limit: '1', size: MiB - 1, status: 201 },
    { limit: '1', size: MiB, status: 413 },
    { limit: '1', size: MiB + 1, status: 413 },
    { limit: '0', size: 50 * MiB + 1, status: 201 },
  ])(
    'MAX_FILE_UPLOAD_SIZE=$limit: $size bytes returns HTTP $status',
    async ({ limit, size, status }) => {
      const response = await upload({ MAX_FILE_UPLOAD_SIZE: limit }, [size]);

      expect(response.status).toBe(status);
      expect(response.data).toMatchObject(
        status === 201 ? { id: '1', public: false, userId: '1' } : { message: 'File too large' },
      );
      expectSavedFiles(status === 201 ? [size] : []);
    },
  );

  it.each([
    { count: 1, limit: '2', status: 201 },
    { count: 2, limit: '2', status: 201 },
    { count: 3, limit: '2', status: 400 },
    { count: 101, limit: '0', status: 201 },
  ])(
    'MAX_FILES_PER_UPLOAD=$limit: $count files returns HTTP $status',
    async ({ count, limit, status }) => {
      const fileSizes = Array.from({ length: count }, (_, index) => index + 1);
      const response = await upload({ MAX_FILES_PER_UPLOAD: limit }, fileSizes);

      expect(response.status).toBe(status);
      expect([response.data].flat()).toMatchObject(
        status === 201
          ? fileSizes.map(() => ({ id: '1', public: false, userId: '1' }))
          : [{ message: 'Too many files' }],
      );
      expectSavedFiles(status === 201 ? fileSizes : []);
    },
  );

  it.each([
    { limit: '1', size: MiB - 1, status: 201 },
    { limit: '1', size: MiB, status: 400 },
    { limit: '1', size: MiB + 1, status: 400 },
    { limit: '0', size: MiB + 1, status: 201 },
  ])(
    'MAX_UPLOAD_FIELD_SIZE=$limit: $size bytes returns HTTP $status',
    async ({ limit, size, status }) => {
      const response = await upload({ MAX_UPLOAD_FIELD_SIZE: limit }, [1], size);

      expect(response.status).toBe(status);
      expect(response.data).toMatchObject(
        status === 201 ? { id: '1', public: false, userId: '1' } : { message: 'Field value too long - evaluationTags' },
      );
      expectSavedFiles(status === 201 ? [1] : []);
      expect(createEvaluation.mock.calls[0]?.[0].evaluationTags?.[0]?.value.length)
        .toBe(status === 201 ? size : undefined);
    },
  );
});
