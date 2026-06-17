#!/usr/bin/env node
/**
 * create-aws-blocks
 * Crea un nuevo proyecto AWS Blocks desde la plantilla base.
 *
 * Uso:
 *   npx create-aws-blocks mi-nuevo-proyecto
 */
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

const TEMPLATE_REPO = 'lfdeleonramirez/aws-blocks/aws-blocks-blank-base';
const TEMPLATE_NAME = 'aws-blocks-blank-base';
const TEMPLATE_SCOPE = 'my-app';

// --- Helpers ---

function replaceInFile(filePath, replacements) {
  let content = readFileSync(filePath, 'utf-8');
  let changed = false;
  for (const [search, replace] of replacements) {
    if (content.includes(search)) {
      content = content.replaceAll(search, replace);
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(filePath, content);
  }
}

function walkFiles(dir, callback) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkFiles(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

// --- Main ---

const projectName = process.argv[2];

if (!projectName) {
  console.error('❌ Debes proporcionar un nombre para el proyecto.');
  console.error('');
  console.error('  npx @luisfdeleonramirez/create-aws-blocks-base mi-nuevo-proyecto');
  console.error('');
  process.exit(1);
}

// Validar nombre
if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(projectName)) {
  console.error('❌ El nombre del proyecto solo puede tener letras minúsculas, números y guiones.');
  console.error(`   Recibido: "${projectName}"`);
  process.exit(1);
}

const targetDir = resolve(process.cwd(), projectName);

console.log(`\n🚀 Creando proyecto "${projectName}"...\n`);
console.log('📦 Plantilla: AWS Blocks Blank Base');
console.log('   Base limpia para iniciar desde cero — sin código de ejemplo.\n');

// 1. Descargar la plantilla con degit
try {
  execSync(`npx --yes degit ${TEMPLATE_REPO} ${projectName}`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
} catch {
  console.error('❌ Error al descargar la plantilla.');
  process.exit(1);
}

// 2. Reemplazar referencias en todos los archivos
console.log('📝 Configurando nombre del proyecto...');

const replacements = [
  [TEMPLATE_NAME, projectName],
  [TEMPLATE_SCOPE, projectName],
];

walkFiles(targetDir, (filePath) => {
  // Solo procesar archivos de texto
  const textExtensions = ['.ts', '.tsx', '.js', '.json', '.html', '.md', '.yaml', '.yml'];
  const ext = filePath.substring(filePath.lastIndexOf('.'));
  if (textExtensions.includes(ext)) {
    replaceInFile(filePath, replacements);
  }
});

console.log('');
console.log(`✅ Proyecto "${projectName}" creado exitosamente.`);
console.log('');
console.log('   Siguiente paso:');
console.log(`   cd ${projectName}`);
console.log('   npm install');
console.log('   npm run dev');
console.log('');
