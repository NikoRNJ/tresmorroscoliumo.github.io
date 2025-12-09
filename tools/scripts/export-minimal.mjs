#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const defaultOutput = path.resolve(rootDir, 'dist', 'deployable');
const argPath = process.argv[2];
const outputDir = argPath ? path.resolve(rootDir, argPath) : defaultOutput;

const directoriesToCopy = ['apps/web', 'packages/core', 'packages/ui', 'packages/database'];

const filesToCopy = [
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'tsconfig.base.json',
  'turbo.json',
  'vitest.config.ts',
  'vitest.e2e.config.ts',
  'README.md',
];

const excludedSegments = new Set([
  'node_modules',
  '.next',
  'dist',
 'build',
  '.turbo',
  '.swc',
  'coverage',
  'test-results',
  'playwright-report',
  '.playwright',
  '.git',
  '.cache',
]);

const excludedExactPaths = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.test',
]);

async function pathExists(targetPath) {
  try {
    await fs.stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

function shouldCopyPath(srcPath) {
  const relative = path.relative(rootDir, srcPath);
  if (!relative || relative.startsWith('..')) {
    return true;
  }

  if (excludedExactPaths.has(relative)) {
    return false;
  }

  const segments = relative.split(path.sep);
  return !segments.some((segment) => excludedSegments.has(segment));
}

async function cleanOutput() {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
}

async function copyEntry(entry) {
  const source = path.resolve(rootDir, entry);
  if (!(await pathExists(source))) {
    console.warn(`⚠️  Omitiendo ${entry}: no existe en el repositorio actual.`);
    return;
  }

  const destination = path.resolve(outputDir, entry);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, {
    recursive: true,
    filter: (src) => shouldCopyPath(src),
  });
  console.log(`✅ Copiado ${entry}`);
}

async function main() {
  console.log(`📦 Generando export minimal en: ${outputDir}`);
  await cleanOutput();

  for (const dir of directoriesToCopy) {
    await copyEntry(dir);
  }

  for (const file of filesToCopy) {
    await copyEntry(file);
  }

  console.log('\n🎉 Exportación lista. Puedes inicializar un repo nuevo en la carpeta generada.');
  console.log('   Ejemplo: git init && pnpm install && pnpm build');
}

main().catch((error) => {
  console.error('❌ Error exportando el proyecto minimal:', error);
  process.exit(1);
});

