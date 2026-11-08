#!/usr/bin/env node
// Dependency vulnerability gate. Runs `npm audit` on the production
// dependency tree and fails if any high or critical advisory isn't in
// security/audit-allowlist.json (each entry there documents why it's
// accepted). Also fails if an allowlist entry is no longer reported, so
// stale exceptions get cleaned up.
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const allow = require(path.join(ROOT, 'security', 'audit-allowlist.json')).accepted;

let report;
try {
  report = JSON.parse(execSync('npm audit --omit=dev --json', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
} catch (err) {
  // npm audit exits non-zero when it finds anything; the JSON is still on stdout.
  if (!err.stdout) {
    console.error('npm audit could not run (offline?):', err.message);
    process.exit(2);
  }
  report = JSON.parse(err.stdout);
}

const vulns = Object.entries(report.vulnerabilities ?? {});
const blocking = vulns.filter(([name, v]) => ['high', 'critical'].includes(v.severity) && !allow[name]);
const stale = Object.keys(allow).filter((name) => !report.vulnerabilities?.[name]);

console.log(`npm audit (production deps): ${JSON.stringify(report.metadata?.vulnerabilities ?? {})}`);
for (const [name, v] of vulns) {
  console.log(`  ${allow[name] ? 'accepted' : v.severity.padEnd(8)}  ${name}`);
}
if (stale.length) console.log(`Allowlist entries no longer reported (remove them): ${stale.join(', ')}`);
if (blocking.length) {
  console.error(`\nFAIL: ${blocking.length} high/critical advisory(ies) not in security/audit-allowlist.json:`);
  for (const [name, v] of blocking) console.error(`  ${name} (${v.severity})`);
  console.error('Try `npm audit fix` (never --force without review), or document an accepted risk.');
  process.exit(1);
}
if (stale.length) process.exit(1);
console.log('PASS: no unaccepted high/critical advisories.');
