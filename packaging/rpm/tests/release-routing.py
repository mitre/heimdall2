#!/usr/bin/env python3
from pathlib import Path
import re
from types import SimpleNamespace

root = Path(__file__).resolve().parents[3]
workflows = root / ".github/workflows"
jobs = {
    "push-to-npm.yml": ("build-deploy", True),
    "release-server-to-docker.yml": ("docker", True),
    "release-lite-to-docker.yml": ("docker", True),
    "gh-pages.yml": ("build-deploy", False),
    "build-rpm.yml": ("build", True),
}
actual = {p.name for p in workflows.glob("*.yml")
          if re.search(r"^  release:\s*$", p.read_text(), re.M)}
assert actual == set(jobs), "Review guards for changed release consumers: " + repr(actual)

def condition(filename, job):
    source = (workflows / filename).read_text()
    block = re.search(r"^  " + re.escape(job) +
                      r":\n(.*?)(?=^  [A-Za-z_][A-Za-z0-9_-]*:|\Z)",
                      source, re.M | re.S)
    assert block, (filename, job)
    guard = re.search(r"^    if: (.+)$", block.group(1), re.M)
    assert guard, (filename, job, "missing release guard")
    return guard.group(1)

def accepts(expression, event, tag):
    github = SimpleNamespace(event_name=event,
        event=SimpleNamespace(release=SimpleNamespace(tag_name=tag)))
    # Evaluate this repository's simple job guards against synthetic event data.
    return bool(eval(expression.replace("&&", " and ").replace("||", " or "),
                     {"__builtins__": {}},
                     {"github": github, "startsWith": str.startswith}))

for filename, (job, manual) in jobs.items():
    expr = condition(filename, job)
    assert accepts(expr, "release", "v2.14.0"), filename
    assert not accepts(expr, "release", "apps/heimdall-cli/v0.9.0"), filename
    assert not accepts(expr, "release", "another-component/v1.0.0"), filename
    if manual:
        assert accepts(expr, "workflow_dispatch", ""), filename
for event in ("push", "pull_request"):
    assert accepts(condition("build-rpm.yml", "build"), event, "")
publish = condition("build-rpm.yml", "publish")
assert accepts(publish, "release", "v2.14.0")
assert not accepts(publish, "release", "apps/heimdall-cli/v0.9.0")
assert not accepts(publish, "workflow_dispatch", "")
print("Server publication is isolated from CLI release events")
