#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function copyAssets() {
  console.log('📦 Copying static assets to dist...');
  
  const copyTasks = [
    // Copy templates
    {
      from: path.join(rootDir, 'src/templates'),
      to: path.join(rootDir, 'dist/templates'),
      name: 'Templates'
    },
    // Copy schema files
    {
      from: path.join(rootDir, 'src/config/glsprc.schema.json'),
      to: path.join(rootDir, 'dist/config/glsprc.schema.json'),
      name: 'Config Schema'
    }
  ];
  
  for (const task of copyTasks) {
    try {
      await fs.ensureDir(path.dirname(task.to));
      await fs.copy(task.from, task.to, { overwrite: true });
      console.log(`✅ Copied ${task.name}: ${path.relative(rootDir, task.from)} → ${path.relative(rootDir, task.to)}`);
    } catch (error) {
      console.error(`❌ Failed to copy ${task.name}:`, error.message);
      process.exit(1);
    }
  }
  
  console.log('✨ All assets copied successfully!');
}

copyAssets().catch(error => {
  console.error('Failed to copy assets:', error);
  process.exit(1);
});