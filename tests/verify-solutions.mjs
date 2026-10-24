import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { exercises as coreExercises } from '../public/exercises.js';
import { ptaExercises } from '../public/pta-exercises.js';

const exercises = [...coreExercises, ...ptaExercises];

const cc = process.env.CC || 'gcc';
const normalize = (value) => String(value).replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n+$/g, '');
let failed = 0;

for (const exercise of exercises) {
  const dir = await mkdtemp(path.join(tmpdir(), 'fx-verify-'));
  const source = path.join(dir, 'main.c');
  const exe = path.join(dir, process.platform === 'win32' ? 'main.exe' : 'main');
  try {
    await writeFile(source, exercise.solution, 'utf8');
    const build = spawnSync(cc, ['-std=c11', '-O2', '-Wall', '-Wextra', '-Wpedantic', '-o', exe, source, '-lm'], { encoding: 'utf8' });
    if (build.status !== 0) {
      failed++;
      console.log(`FAIL build ${exercise.id}`);
      console.log(build.stderr || build.stdout);
      continue;
    }
    for (const test of exercise.tests) {
      const run = spawnSync(exe, [], { input: test.input, encoding: 'utf8', timeout: 3000 });
      const actual = normalize(run.stdout || '');
      const expected = normalize(test.expected);
      if (run.status !== 0 || actual !== expected) {
        failed++;
        console.log(`FAIL case ${exercise.id} / ${test.name}`);
        console.log('expected:', JSON.stringify(expected));
        console.log('actual:  ', JSON.stringify(actual));
        if (run.stderr) console.log(run.stderr);
      }
    }
    if (build.stderr.trim()) {
      console.log(`WARN ${exercise.id}: ${build.stderr.trim().split(/\r?\n/)[0]}`);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

if (failed) {
  console.error(`\n${failed} verification failure(s).`);
  process.exit(1);
}
console.log(`Verified ${exercises.length} exercises and ${exercises.reduce((sum, item) => sum + item.tests.length, 0)} test cases.`);


