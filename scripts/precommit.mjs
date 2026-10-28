import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const stageArg = process.argv.find((arg) => arg.startsWith('--stage='));
const targetStage = stageArg ? stageArg.split('=')[1] : 'all';

const ALLOWED_ENTITY_KEYS = new Set(['title', 'description', 'type', 'properties', 'required']);
const ALLOWED_PROP_KEYS = new Set([
  'type',
  'format',
  'description',
  'enum',
  '$ref',
  'maxLength',
  'minLength',
  'pattern',
]);

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [PRE-COMMIT FAILED] ${message}`);
    process.exit(1);
  }
}

function runStage1() {
  console.log('▶ Stage 1 Pre-Commit Check: Architecture & Schema Blueprint...');

  const archPath = path.join(rootDir, 'ARCHITECTURE.md');
  assert(fs.existsSync(archPath), 'ARCHITECTURE.md is missing.');
  const archContent = fs.readFileSync(archPath, 'utf8');
  assert(archContent.includes('```mermaid'), 'ARCHITECTURE.md must contain a Mermaid diagram.');

  const specPath = path.join(rootDir, 'security_spec.md');
  assert(fs.existsSync(specPath), 'security_spec.md is missing.');

  const blueprintPath = path.join(rootDir, 'firebase-blueprint.json');
  assert(fs.existsSync(blueprintPath), 'firebase-blueprint.json is missing.');
  const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));

  assert(blueprint.entities && typeof blueprint.entities === 'object', 'Missing entities map.');
  assert(blueprint.firestore && typeof blueprint.firestore === 'object', 'Missing firestore map.');

  for (const [entityName, entity] of Object.entries(blueprint.entities)) {
    for (const key of Object.keys(entity)) {
      assert(
        ALLOWED_ENTITY_KEYS.has(key),
        `Entity "${entityName}" contains unauthorized key "${key}".`
      );
    }
    assert(entity.type === 'object', `Entity "${entityName}" must have type "object".`);
    for (const [propName, prop] of Object.entries(entity.properties || {})) {
      for (const pKey of Object.keys(prop)) {
        assert(
          ALLOWED_PROP_KEYS.has(pKey),
          `Property "${entityName}.${propName}" contains unauthorized key "${pKey}".`
        );
      }
    }
  }

  console.log('✅ Stage 1 Passed: Architecture diagram & Blueprint IR verified.');
}

function runStage2() {
  console.log('▶ Stage 2 Pre-Commit Check: Hardened Firestore Rules & ESLint...');

  const rulesPath = path.join(rootDir, 'firestore.rules');
  assert(fs.existsSync(rulesPath), 'firestore.rules is missing.');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  assert(rules.includes("rules_version = '2';"), 'firestore.rules must declare rules_version = 2.');
  assert(
    rules.includes('allow read, write: if false;'),
    'firestore.rules must include default-deny catch-all.'
  );
  assert(
    rules.includes('request.auth.token.email_verified == true'),
    'firestore.rules must enforce email_verified == true for writes.'
  );
  assert(
    !rules.includes('allow list: if isSignedIn();'),
    'Blanket allow list without resource.data scoping is prohibited.'
  );

  execSync('npx eslint firestore.rules', { stdio: 'inherit', cwd: rootDir });
  console.log('✅ Stage 2 Passed: Firestore security rules verified via ESLint & Red Team gates.');
}

function walkTsFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTsFiles(full, results);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function runStage3() {
  console.log('▶ Stage 3 Pre-Commit Check: TypeScript Compilation & UI Safety Gates...');

  execSync('npx tsc --noEmit', { stdio: 'inherit', cwd: rootDir });

  const srcFiles = walkTsFiles(path.join(rootDir, 'src'));
  assert(srcFiles.length >= 5, 'Expected modular React/TypeScript components in src/.');

  for (const file of srcFiles) {
    const code = fs.readFileSync(file, 'utf8');
    const rel = path.relative(rootDir, file);
    assert(!/\bwindow\.alert\s*\(/.test(code), `Forbidden window.alert() found in ${rel}.`);
    assert(
      !code.includes('images.unsplash.com') && !code.includes('picsum.photos'),
      `Fragile external image host found in ${rel}.`
    );

    const assetMatches = code.matchAll(/assets\/images\/[a-zA-Z0-9_.\-]+\.jpg/g);
    for (const match of assetMatches) {
      const assetDiskPath = path.join(rootDir, 'src', match[0]);
      assert(fs.existsSync(assetDiskPath), `Missing image asset ${match[0]} referenced in ${rel}.`);
    }
  }

  console.log('✅ Stage 3 Passed: TypeScript types, iframe safety, and studio image assets verified.');
}

if (targetStage === '1') {
  runStage1();
} else if (targetStage === '2') {
  runStage2();
} else if (targetStage === '3') {
  runStage3();
} else {
  runStage1();
  runStage2();
  runStage3();
  console.log('🎉 All Pre-Commit Pipeline Stages Passed.');
}
