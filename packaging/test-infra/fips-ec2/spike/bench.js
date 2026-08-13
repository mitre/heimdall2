// PBKDF2 benchmark harness — heimdall2-e25.1 (ADR-006 §11 on target hardware).
// Lives in-repo so every published number is re-derivable. Reports a
// concurrency LADDER with per-op latency at each level, so serial timings can
// never be mistaken for a saturation ceiling (the defect in this harness's v1).
// Note: ladder sample count per level is 2×C (small at C=1) — the ladder
// characterizes queueing shape and throughput; latency-of-record claims should
// come from a dedicated high-N sequential run (spike doc pastes a 40-sample one).
'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');

const ITER = Number(process.env.BENCH_ITER || 600_000);
const pct = (a, p) => {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};
const pbkdf2Timed = (pw) =>
  new Promise((res, rej) => {
    const t = process.hrtime.bigint();
    crypto.pbkdf2(pw, crypto.randomBytes(32), ITER, 64, 'sha512', (e) =>
      e ? rej(e) : res(Number(process.hrtime.bigint() - t) / 1e6)
    );
  });

const steal = () => {
  // /proc/stat cpu line: user nice system idle iowait irq softirq steal
  const f = fs.readFileSync('/proc/stat', 'utf8').split('\n', 1)[0].trim().split(/\s+/).slice(1).map(Number);
  return {steal: f[7], total: f.reduce((a, b) => a + b, 0)};
};

(async () => {
  console.log(`fips=${crypto.getFips()} node=${process.version} iter=${ITER} nproc=${os.cpus().length} threadpool=${process.env.UV_THREADPOOL_SIZE || '4 (default)'}`);

  // Warmup
  await Promise.all([pbkdf2Timed('warm'), pbkdf2Timed('warm')]);

  // Sequential latency phase — the latency source of record (high-N, one op
  // in flight). SEQ_N=0 to skip.
  const SEQ_N = Number(process.env.BENCH_SEQ_N ?? 40);
  if (SEQ_N > 0) {
    const seq = [];
    for (let i = 0; i < SEQ_N; i++) seq.push(await pbkdf2Timed('CorrectHorseBatteryStaple15!'));
    console.log(`latency ms — p50: ${pct(seq, 50).toFixed(1)}, p95: ${pct(seq, 95).toFixed(1)}, min: ${Math.min(...seq).toFixed(1)}, max: ${Math.max(...seq).toFixed(1)}`);
  }

  // Concurrency ladder: at each level C, run 2 batches of C concurrent ops.
  // Per-op latency + wall time together distinguish serial from parallel:
  // parallel => per-op latency grows while ops/sec grows; serial => flat
  // latency, flat ops/sec.
  console.log('C\tops\twall_s\tops/sec\top_p50_ms\top_p95_ms\tsteal%');
  for (const C of [1, 2, 4, 8, 16, 32]) {
    const ops = C * 2;
    const lats = [];
    const s0 = steal();
    const t0 = process.hrtime.bigint();
    for (let batch = 0; batch < 2; batch++) {
      const r = await Promise.all(Array.from({length: C}, () => pbkdf2Timed('CorrectHorse15!')));
      lats.push(...r);
    }
    const wall = Number(process.hrtime.bigint() - t0) / 1e9;
    const s1 = steal();
    const stealPct = (100 * (s1.steal - s0.steal)) / Math.max(1, s1.total - s0.total);
    console.log(`${C}\t${ops}\t${wall.toFixed(1)}\t${(ops / wall).toFixed(2)}\t${pct(lats, 50).toFixed(0)}\t${pct(lats, 95).toFixed(0)}\t${stealPct.toFixed(1)}`);
  }

  // fs.readFile under sustained KDF load (8 concurrent, refilled) vs baseline
  fs.writeFileSync('/tmp/bench-probe', 'x'.repeat(4096));
  const readOnce = () =>
    new Promise((res) => {
      const t = process.hrtime.bigint();
      fs.readFile('/tmp/bench-probe', () => res(Number(process.hrtime.bigint() - t) / 1e6));
    });
  const base = [];
  for (let i = 0; i < 50; i++) base.push(await readOnce());

  let stop = false;
  // 8 refilled workers: each starts its next KDF the moment the previous one
  // finishes — the same sustained-8-concurrent load as the original pump.
  const workers = Array.from({length: 8}, async () => {
    while (!stop) {
      await pbkdf2Timed('load');
    }
  });
  const loaded = [];
  for (let i = 0; i < 50; i++) loaded.push(await readOnce());
  stop = true;
  await Promise.all(workers);

  console.log(`fs.readFile ms — baseline p50=${pct(base, 50).toFixed(2)} p95=${pct(base, 95).toFixed(2)} | under sustained 8-KDF load p50=${pct(loaded, 50).toFixed(2)} p95=${pct(loaded, 95).toFixed(2)}`);
})().catch((error) => {
  console.error('BENCH FAILED:', error.message);
  process.exit(1);
});
