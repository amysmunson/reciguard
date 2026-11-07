// No credentials in the repository, and the app only ever reads public
// (EXPO_PUBLIC_*) configuration — anything EXPO_PUBLIC_ is compiled into the
// app bundle, so it must never be a secret.
const { git, textFiles, appSourceFiles, read } = require('../helpers/repoFiles');

const SECRET_PATTERNS = [
  [/sb_secret_[A-Za-z0-9_-]{10,}/, 'Supabase secret key'],
  [/-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/, 'private key'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key'],
  [/ghp_[A-Za-z0-9]{30,}/, 'GitHub token'],
  [/AIza[0-9A-Za-z_-]{35}/, 'Google API key'],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, 'Slack token'],
];

// A Supabase JWT whose payload says role: service_role bypasses RLS.
const serviceRoleJwts = (text) =>
  (text.match(/eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g) ?? []).filter((jwt) => {
    try {
      const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'));
      return payload.role === 'service_role';
    } catch {
      return false;
    }
  });

test('no secrets or service-role keys in committed (or new) files', () => {
  const findings = [];
  for (const f of textFiles()) {
    const text = read(f);
    for (const [re, label] of SECRET_PATTERNS) if (re.test(text)) findings.push(`${f}: ${label}`);
    if (serviceRoleJwts(text).length) findings.push(`${f}: Supabase service_role JWT`);
  }
  expect(findings).toEqual([]);
});

test('.env files are never committed (only .env.example)', () => {
  const envFiles = git('ls-files').filter((f) => /(^|\/)\.env(\..*)?$/.test(f) && !f.endsWith('.env.example'));
  expect(envFiles).toEqual([]);
});

test('app code only reads public EXPO_PUBLIC_* config, none named like a secret', () => {
  const vars = new Set();
  for (const f of appSourceFiles()) {
    for (const m of read(f).matchAll(/process\.env\.([A-Z0-9_]+)/g)) vars.add(m[1]);
  }
  for (const v of vars) {
    expect(v.startsWith('EXPO_PUBLIC_')).toBe(true);
    expect(v).not.toMatch(/SECRET|SERVICE|PRIVATE|PASSWORD/);
  }
  expect([...vars].sort()).toEqual(['EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'EXPO_PUBLIC_SUPABASE_URL']);
});
