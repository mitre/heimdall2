import type { DynamicModule, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MulterModule } from '@nestjs/platform-express';
import { MULTER_MODULE_OPTIONS } from '@nestjs/platform-express/multer/files.constants';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigService } from '../config/config.service';
import { EvaluationsModule } from './evaluations.module';

// Exercise the module's actual Multer configuration without a database.
const imports = new Reflector().get<(DynamicModule | Type)[]>(
  'imports',
  EvaluationsModule,
);
const multerRegistration = imports.find(
  (entry): entry is DynamicModule =>
    'module' in entry && entry.module === MulterModule,
);

describe('EvaluationsModule upload limits', () => {
  let module: TestingModule | undefined;

  afterEach(async () => {
    await module?.close();
    module = undefined;
    vi.restoreAllMocks();
  });

  async function createOptions(
    values: Record<string, string | undefined>,
  ): Promise<MulterOptions> {
    if (!multerRegistration) {
      throw new Error('EvaluationsModule must configure Multer');
    }
    const configService = new ConfigService();
    const configValues = new Map(Object.entries(values));
    vi.spyOn(configService, 'get').mockImplementation(key => configValues.get(key));
    module = await Test.createTestingModule({ imports: [multerRegistration] })
      .overrideProvider(ConfigService)
      .useValue(configService)
      .compile();
    return module.get<MulterOptions>(MULTER_MODULE_OPTIONS);
  }

  it('passes both configured limits to Multer', async () => {
    const options = await createOptions({
      MAX_FILE_UPLOAD_SIZE: '0.5',
      MAX_FILES_PER_UPLOAD: '2',
    });
    expect(options.limits).toEqual({ files: 2, fileSize: 524_288 });
  });

  it.each(['MAX_FILE_UPLOAD_SIZE', 'MAX_FILES_PER_UPLOAD'])(
    'rejects invalid %s during module initialization',
    async (key) => {
      await expect(createOptions({ [key]: 'invalid' })).rejects.toThrow(key);
    },
  );
});
