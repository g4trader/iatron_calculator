import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const out = process.env.MENTORY_REVIEW_DIR;
if (!out || process.env.IATRON_ENV !== 'e2e' || !process.env.DATABASE_URL?.includes('127.0.0.1')) throw new Error('Somente ambiente local E2E.');
await mkdir(path.join(out, 'logs'), { recursive: true });
async function run(args, env) { return new Promise(resolve => { const child = spawn(process.execPath, args, { env }); let log = ''; child.stdout.on('data', b => log += b); child.stderr.on('data', b => log += b); child.on('exit', code => resolve({ code, log: log.replace(/"password": "[^"]+",?/g, '"password": "[synthetic fixture redacted]",') })); }); }
let failed = false;
for (const project of ['chromium', 'mobile-chrome']) {
  for (const [name, files] of [['clinical-commercial-security', ['clinical-resources.spec.ts', 'commercial-funnel.spec.ts', 'security-session.spec.ts']], ['system', ['system-flow.spec.ts']], ...(project === 'mobile-chrome' ? [['mentory', ['mentory.spec.ts']]] : [])]) {
    const env = { ...process.env, RATE_LIMIT_ALLOW_MEMORY_FALLBACK: 'true', STRIPE_PRICE_PROFESSIONAL_ANNUAL: 'price_synthetic_visual_only', MENTORY_PUBLICATION_APPROVAL: name === 'mentory' ? 'LOCAL-E2E-SYNTHETIC-ONLY' : '' };
    const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3000'], { env, stdio: 'ignore' });
    try {
      for (let attempt = 0; attempt < 100; attempt++) { try { if ((await fetch('http://127.0.0.1:3000/mentory')).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
      const result = await run(['node_modules/@playwright/test/cli.js', 'test', ...files, `--project=${project}`, '--timeout=60000', '--reporter=line'], env);
      await writeFile(path.join(out, 'logs', `regression-${project}-${name}.log`), result.log); console.log(project, name, result.code); if (result.code) failed = true;
    } finally { server.kill('SIGTERM'); await new Promise(r => server.once('exit', r)); }
  }
}
if (failed) process.exitCode = 1;
