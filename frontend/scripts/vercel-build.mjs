import { execFileSync } from 'node:child_process';
// Normal builds stay unchanged. Production migration requires an explicit build-only flag.
if (process.env.ALLOW_PRODUCTION_MIGRATIONS === 'true') {
  execFileSync(process.execPath, ['scripts/deploy-pending-resources.mjs'], { env: process.env, stdio: 'inherit' });
}
execFileSync('npm', ['run', 'build'], { env: process.env, stdio: 'inherit' });
