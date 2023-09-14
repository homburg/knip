import assert from 'node:assert/strict';
import { test } from 'bun:test';
import { main } from '../../src/index.js';
import * as vitest from '../../src/plugins/vitest/index.js';
import { resolve, join } from '../../src/util/path.js';
import baseArguments from '../helpers/baseArguments.js';
import baseCounters from '../helpers/baseCounters.js';
import { getManifest } from '../helpers/index.js';

const cwd = resolve('fixtures/plugins/vitest');
const manifest = getManifest(cwd);

test('Find dependencies in vitest configuration (vitest)', async () => {
  const configFilePath = join(cwd, 'vitest.config.ts');
  const dependencies = await vitest.findDependencies(configFilePath, { cwd, manifest });
  assert.deepEqual(dependencies, ['happy-dom', '@vitest/coverage-istanbul', './setup.js', './src/setupTests.ts']);
});

test('Find dependencies in vitest configuration without coverage providers (vitest)', async () => {
  const configFilePath = join(cwd, 'vitest-default-coverage.config');
  const dependencies = await vitest.findDependencies(configFilePath, { cwd, manifest });
  assert.deepEqual(dependencies, ['jsdom', '@vitest/coverage-v8']);
});

test('Find dependencies in vitest configuration (vite)', async () => {
  const configFilePath = join(cwd, 'vite.config.ts');
  const dependencies = await vitest.findDependencies(configFilePath, { cwd, manifest });
  assert.deepEqual(dependencies, ['@edge-runtime/vm', '@vitest/coverage-c8', './setup.js', './global.ts']);
});

test('Find dependencies in vitest configuration', async () => {
  const { issues, counters } = await main({
    ...baseArguments,
    cwd,
  });

  assert(issues.unlisted['vitest.config.ts']['happy-dom']);
  assert(issues.unlisted['vitest.config.ts']['@vitest/coverage-istanbul']);
  assert(issues.unresolved['vitest.config.ts']['./setup.js']);

  assert.deepEqual(counters, {
    ...baseCounters,
    files: 2,
    unlisted: 2,
    unresolved: 1,
    processed: 5,
    total: 5,
  });
});
