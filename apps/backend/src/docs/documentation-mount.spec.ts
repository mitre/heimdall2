import { staticRootFixture } from './static-root.fixture';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { documentationRoot, frontendRoot } from '../config/static-paths';
import { AppModule } from '../app.module';

// Markers standing in for the two real builds. The mount under test routes by
// PATH, so the bodies only need to be distinguishable — using fixtures instead
// of the real output keeps this spec hermetic: no dependence on the repo
// layout, and no dependence on anyone having run a build first.
const DOCS_MARKER = '<!-- fixture: vitepress docs -->';
const NESTED_DOCS_MARKER = '<!-- fixture: vitepress getting-started -->';
const SPA_MARKER = '<!-- fixture: vue spa -->';
// A docs/ directory colliding inside the SPA build — see the ordering test.
const SPA_COLLISION_MARKER = '<!-- fixture: spa docs collision -->';

describe('in-app documentation mount', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    // A self-contained static root: <tmp>/frontend and <tmp>/docs, exactly the
    // layout the built server serves from.
    mkdirSync(path.join(staticRootFixture, 'frontend', 'docs'), {
      recursive: true,
    });
    mkdirSync(path.join(staticRootFixture, 'docs', 'getting-started'), {
      recursive: true,
    });
    writeFileSync(
      path.join(staticRootFixture, 'frontend', 'index.html'),
      SPA_MARKER,
    );
    writeFileSync(
      path.join(staticRootFixture, 'frontend', 'docs', 'index.html'),
      SPA_COLLISION_MARKER,
    );
    writeFileSync(path.join(staticRootFixture, 'docs', 'index.html'), DOCS_MARKER);
    writeFileSync(
      path.join(staticRootFixture, 'docs', 'getting-started', 'index.html'),
      NESTED_DOCS_MARKER,
    );

    // NestFactory.create, not Test.createTestingModule().createNestApplication():
    // this is exactly how main.ts boots, and static mounting is sensitive to it.
    app = await NestFactory.create(AppModule);
    await app.init();
    // Port 0 = ephemeral, so this never collides with a dev server.
    await app.listen(0);
    const address = app.getHttpServer().address();
    if (address === null || typeof address !== 'object') {
      throw new TypeError('expected the test server to bind a TCP port');
    }
    baseUrl = `http://127.0.0.1:${String(address.port)}`;
  });

  afterAll(async () => {
    await app.close();
    rmSync(staticRootFixture, { force: true, recursive: true });
  });

  it('resolves both static roots from HEIMDALL_STATIC_ROOT', () => {
    // Guards the seam the assertions below depend on. If this passes while
    // they fail, the paths are right and the mount itself is at fault.
    expect(frontendRoot()).toBe(path.join(staticRootFixture, 'frontend'));
    expect(documentationRoot()).toBe(path.join(staticRootFixture, 'docs'));
  });

  it('serves the documentation at /docs/, not the SPA', async () => {
    const response = await fetch(`${baseUrl}/docs/`);

    expect(response.status).toBe(200);
    // Asserts the BODY. The SPA mount answers unmatched routes with its own
    // index.html, so a status-only check would pass while serving the wrong
    // thing entirely.
    expect(await response.text()).toContain(DOCS_MARKER);
  });

  it('serves a nested documentation page', async () => {
    const response = await fetch(`${baseUrl}/docs/getting-started/`);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain(NESTED_DOCS_MARKER);
  });

  it('returns a REAL 404 for an unknown documentation path', async () => {
    // Not the docs home (soft 404 from a render fallback) and not the SPA
    // shell (the catch-all swallowing the path). Both would be 200.
    const response = await fetch(`${baseUrl}/docs/no-such-page`);
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(body).not.toContain(DOCS_MARKER);
    expect(body).not.toContain(SPA_MARKER);
  });

  it('still serves the SPA at the application root', async () => {
    const response = await fetch(`${baseUrl}/`);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain(SPA_MARKER);
  });

  it('leaves the SPA catch-all intact for unknown application routes', async () => {
    // The SPA is a client-routed app: unknown NON-docs paths must still get
    // the shell so the router can handle them.
    const response = await fetch(`${baseUrl}/results/some-client-route`);

    expect(response.status).toBe(200);
    expect(await response.text()).toContain(SPA_MARKER);
  });

  it('prefers the docs mount over a colliding path inside the SPA build', async () => {
    // If the frontend build ever emits its own docs/ directory, the entry
    // registered FIRST wins. This is what makes docs-first load-bearing rather
    // than decorative — without it, ordering could be swapped unnoticed.
    const response = await fetch(`${baseUrl}/docs/`);

    expect(await response.text()).not.toContain(SPA_COLLISION_MARKER);
  });

  it('leaves application routes unaffected', async () => {
    const response = await fetch(`${baseUrl}/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'ok' });
  });
});
