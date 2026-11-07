// Source files for static security checks: everything git tracks (so the
// checks see exactly what gets committed), plus untracked app source that
// isn't ignored — so a new file is checked before it's ever added.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const git = (args) =>
  execSync(`git ${args}`, { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);

const trackedAndNew = () => {
  const files = new Set([...git('ls-files'), ...git('ls-files --others --exclude-standard')]);
  return [...files].filter((f) => fs.existsSync(path.join(ROOT, f)));
};

const TEXT_EXT = /\.(js|jsx|ts|tsx|json|md|sql|sh|yml|yaml|txt|env|example|plist|xml|gradle|properties)$/i;
const BINARY_OR_HUGE = /(^|\/)(package-lock\.json|assets\/|demo\/)/;

const textFiles = () =>
  trackedAndNew().filter((f) => TEXT_EXT.test(f) && !BINARY_OR_HUGE.test(f));

// App code that ships in the bundle.
const appSourceFiles = () =>
  trackedAndNew().filter((f) => /^(App\.js|index\.js|screens\/|components\/|lib\/|constants\/|styles\/).*\.js$/.test(f));

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

module.exports = { ROOT, git, trackedAndNew, textFiles, appSourceFiles, read };
