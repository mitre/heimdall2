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

describe('EvaluationsModule MAX_FILE_UPLOAD_SIZE', () => {
  let module: TestingModule | undefined;

  afterEach(async () => {
    await module?.close();
    module = undefined;
    vi.restoreAllMocks();
  });

  async function createOptions(value: string): Promise<MulterOptions> {
    if (!multerRegistration) {
      throw new Error('EvaluationsModule must configure Multer');
    }
    const configService = new ConfigService();
    vi.spyOn(configService, 'get').mockReturnValue(value);
    module = await Test.createTestingModule({ imports: [multerRegistration] })
      .overrideProvider(ConfigService)
      .useValue(configService)
      .compile();
    return module.get<MulterOptions>(MULTER_MODULE_OPTIONS);
  }

  it('passes the configured size to Multer in bytes', async () => {
    const options = await createOptions('0.5');
    expect(options.limits?.fileSize).toBe(524_288);
  });

  it('disables the size cap when configured as 0', async () => {
    const options = await createOptions('0');
    expect(options.limits?.fileSize).toBe(Infinity);
  });

  it('rejects invalid configuration during module initialization', async () => {
    await expect(createOptions('abc')).rejects.toThrow('MAX_FILE_UPLOAD_SIZE');
  });
});
