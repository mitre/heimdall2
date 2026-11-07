import 'reflect-metadata';
import { Readable } from 'node:stream';
import type { DynamicModule, ExecutionContext, FactoryProvider, NestInterceptor } from '@nestjs/common';
import { PayloadTooLargeException } from '@nestjs/common';
import { INTERCEPTORS_METADATA, MODULE_METADATA } from '@nestjs/common/constants';
import { MulterModule } from '@nestjs/platform-express';
import { MULTER_MODULE_OPTIONS } from '@nestjs/platform-express/multer/files.constants';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsModule } from './evaluations.module';

async function parseFiles(sizes: number[], raw: string | undefined = '1') {
  // eslint-disable-next-line unicorn/no-nonstandard-builtin-properties, @typescript-eslint/unbound-method -- Inspect Nest decorator metadata without invoking the controller.
  const interceptors = Reflect.getMetadata(INTERCEPTORS_METADATA, EvaluationsController.prototype.create);
  const UploadInterceptor = interceptors[0] as new (options: unknown) => NestInterceptor;
  const interceptor = new UploadInterceptor(await uploadOptions(raw));
  const boundary = 'heimdall-upload-test';
  const parts: Buffer[] = [];
  for (const [index, size] of sizes.entries()) {
    parts.push(
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${index}.json"\r\nContent-Type: application/json\r\n\r\n`),
      Buffer.alloc(size, 0x20),
      Buffer.from('\r\n'),
    );
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(parts);
  const request = Object.assign(Readable.from(body), {
    headers: { 'content-length': String(body.length), 'content-type': `multipart/form-data; boundary=${boundary}` },
    method: 'POST',
  });
  const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => ({}) }) } as unknown as ExecutionContext;
  const next = { handle: vi.fn(() => of(null)) };
  try {
    await interceptor.intercept(context, next);
  } catch (error) {
    expect(next.handle).not.toHaveBeenCalled();
    throw error;
  }
  expect(next.handle).toHaveBeenCalledOnce();
}

function uploadOptions(raw: string | undefined) {
  // eslint-disable-next-line unicorn/no-nonstandard-builtin-properties -- Nest stores module registration through reflect-metadata.
  const imports: DynamicModule[] = Reflect.getMetadata(MODULE_METADATA.IMPORTS, EvaluationsModule);
  const registration = imports.find(item => item.module === MulterModule);
  expect(registration, 'EvaluationsModule must register upload options').toBeDefined();
  const provider = registration!.providers!.find(item =>
    (item as FactoryProvider).provide === MULTER_MODULE_OPTIONS,
  ) as FactoryProvider;
  return provider.useFactory({ get: (key: string) => key === 'MAX_FILE_UPLOAD_SIZE' ? raw : undefined });
}

describe('evaluation upload limits', () => {
  it('uses a 50 MiB default and retains the 100-file limit', async () => {
    expect(await uploadOptions(undefined)).toMatchObject({ limits: { files: 100, fileSize: 50 * 1024 * 1024 } });
  });
  it('accepts multiple files below the configured cap', async () => {
    await expect(parseFiles([1024 * 1024 - 1, 16])).resolves.toBeUndefined();
  });
  it.each([1024 * 1024, 2 * 1024 * 1024])('rejects a file of %s bytes at or over Multer’s cap', async (size) => {
    await expect(parseFiles([size])).rejects.toBeInstanceOf(PayloadTooLargeException);
  });
  it('rejects a 101st file', async () => {
    await expect(parseFiles(Array.from({ length: 101 }, (_, index) => index + 1))).rejects.toThrow('Too many files');
  });
  it.each(['', '0', '-1', '1.5', 'NaN', 'Infinity', '999999999999999999999'])('rejects invalid size %j', (raw) => {
    expect(() => uploadOptions(raw)).toThrow('MAX_FILE_UPLOAD_SIZE');
  });
});
