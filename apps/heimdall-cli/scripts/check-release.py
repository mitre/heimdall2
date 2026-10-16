#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

cli = Path(__file__).resolve().parents[1]
repo = cli.parents[1]
if len(sys.argv) != 2:
    sys.exit("Usage: check-release.py apps/heimdall-cli/vX.Y.Z")
version = (cli / "VERSION").read_text()
if not re.fullmatch(r"v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\n", version):
    sys.exit("CLI VERSION must contain one canonical vX.Y.Z line")
version = version.strip()
tag = sys.argv[1]
if tag != "apps/heimdall-cli/" + version:
    sys.exit("CLI release tag does not match CLI VERSION")
def git(*args):
    return subprocess.check_output(
        ["git", "-C", str(repo), *args], text=True,
        stderr=subprocess.PIPE).strip()
try:
    if git("rev-parse", "--verify", "refs/tags/" + tag + "^{commit}") != git("rev-parse", "HEAD"):
        sys.exit("CLI release tag does not point at HEAD")
    if git("status", "--porcelain", "--untracked-files=all", "--", "apps/heimdall-cli"):
        sys.exit("CLI release source is dirty")
except subprocess.CalledProcessError as error:
    sys.exit("Cannot validate CLI tag: " + error.stderr.strip())
print(version[1:])
