#!/usr/bin/env bash
# Two-container throughput discriminator — heimdall2-e25.1 spike F4.
# Runs continuous C=1 PBKDF2@600k in two ISOLATED podman containers
# simultaneously for 15s each. If aggregate throughput matches the in-process
# ceiling (~1.7 ops/sec on 1 physical core), the bound is silicon; if it
# doubles, the bound was in-process (threadpool or provider lock).
# Observed 2026-08-08 on FIPS t3.medium: A 0.82 + B 0.83 = 1.65 ops/sec
# aggregate — the bound is the physical core.
set -euo pipefail
IMG="${1:-registry.access.redhat.com/ubi9/nodejs-22-minimal:1}"

run_one() {
  local label="$1"
  podman run --rm "$IMG" node -e "
    const c=require('crypto');const t=Date.now();let n=0;
    const go=()=>c.pbkdf2('$label',c.randomBytes(32),600000,64,'sha512',()=>{
      n++;
      if(Date.now()-t<15000)go();
      else console.log('$label ops:',n,'in',(Date.now()-t)/1000,'s =',(n/((Date.now()-t)/1000)).toFixed(2),'ops/sec')
    });go()"
}

run_one A & run_one B & wait
