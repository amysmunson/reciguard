#!/usr/bin/env node
// One command to check the app still works: `npm run verify`.
//   1. ESLint (new errors only — see BASELINE below)
//   2. Unit tests (app logic + components)
//   3. Security tests (secrets, session storage, sign-out wipe, unsafe
//      links, input limits, code hygiene)
//   4. Dependency audit (scripts/audit.js)
//   5. iOS bundle build (catches import / syntax errors the tests don't load)
// Stops at the first failing step.
const { execSync } = require('child_process');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// ESLint problems that predate the test suite (React Compiler
// "preserve-manual-memoization" and lib/app/cache.js hook rules after the SDK 57
// upgrade). verify fails if the count goes ABOVE this; lower it as they're fixed.
const LINT_BASELINE = 6;

const run = (label, cmd) => {
  console.log(`\n=== ${label} ===`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
};

const lint = () => {
  console.log('\n=== Lint ===');
  let out = '[]';
  try {
    out = execSync('npx eslint . -f json', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (err) {
    out = err.stdout || '[]';
  }
  const files = JSON.parse(out);
  const problems = files.flatMap((f) => f.messages.map((m) => `${path.relative(ROOT, f.filePath)}:${m.line} ${m.ruleId}`));
  console.log(`${problems.length} problem(s) (baseline ${LINT_BASELINE})`);
  if (problems.length > LINT_BASELINE) {
    problems.forEach((p) => console.log(`  ${p}`));
    throw new Error(`Lint problems increased from ${LINT_BASELINE} to ${problems.length}.`);
  }
};

try {
  lint();
  run('Unit tests', 'npx jest --selectProjects unit');
  run('Security tests', 'npx jest --selectProjects security');
  run('Dependency audit', 'node scripts/audit.js');
  const out = path.join(os.tmpdir(), 'reciguard-verify-export');
  run('iOS bundle build', `npx expo export --platform ios --output-dir "${out}"`);
  console.log('\nAll checks passed.');
} catch (err) {
  console.error(`\nverify failed: ${err.message}`);
  process.exit(1);
}
