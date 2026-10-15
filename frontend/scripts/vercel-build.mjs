import { execFileSync } from 'node:child_process';
// Normal builds stay unchanged. Production migration requires an explicit build-only flag.
if (process.env.ALLOW_PRODUCTION_MIGRATIONS === 'true') {
  execFileSync(process.execPath, ['scripts/deploy-pending-resources.mjs'], { env: process.env, stdio: 'inherit' });
}
if (process.env.MENTORY_MEDIA_PREFLIGHT === 'true') execFileSync(process.execPath, ['--import', 'tsx', 'scripts/mentory-media-preflight.ts'], { env: process.env, stdio: 'inherit' });
execFileSync('npm', ['run', 'build'], { env: process.env, stdio: 'inherit' });
