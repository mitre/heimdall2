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

def evaluate(expression, **context):
    expression = re.sub(r"^\$\{\{\s*|\s*\}\}$", "", expression)
    # Evaluate this repository's simple expressions against synthetic event data.
    return eval(expression.replace("&&", " and ").replace("||", " or "),
                {"__builtins__": {}},
                {"startsWith": str.startswith, **context})

def accepts(expression, event, tag, ref=""):
    github = SimpleNamespace(event_name=event, ref=ref,
        event=SimpleNamespace(release=SimpleNamespace(tag_name=tag)))
    return bool(evaluate(expression, github=github))

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

for filename, checkout_count in (("heimdall-cli-release.yml", 2),
                                 ("heimdall-cli-ci.yml", 1)):
    source = (workflows / filename).read_text()
    refs = re.findall(r"^          ref: (.+)$", source, re.M)
    assert len(refs) == checkout_count, (filename, "review changed checkouts")
    for ref in ("refs/heads/master", "refs/heads/cli-candidate",
                "refs/tags/apps/heimdall-cli/v0.9.0"):
        github = SimpleNamespace(sha="a" * 40, ref=ref,
            event=SimpleNamespace(inputs=SimpleNamespace(ref="untrusted")))
        for expression in refs:
            selected = evaluate(expression, github=github,
                inputs=SimpleNamespace(ref="untrusted"),
                needs=SimpleNamespace(prepare=SimpleNamespace(
                    outputs=SimpleNamespace(sha="b" * 40))))
            assert selected == github.sha, (filename, ref, selected)

ci = (workflows / "heimdall-cli-ci.yml").read_text()
cache = re.search(r"^          cache: (.+)$", ci, re.M).group(1)
publish = condition("heimdall-cli-release.yml", "publish")
for event, ref, cached, published in (
    ("pull_request", "refs/pull/42/merge", True, False),
    ("push", "refs/heads/master", True, False),
    ("push", "refs/tags/v2.14.0", False, False),
    ("push", "refs/tags/apps/heimdall-cli/v0.9.0", False, True),
    ("workflow_dispatch", "refs/heads/master", False, False),
    ("workflow_dispatch", "refs/heads/cli-candidate", False, False),
    ("workflow_dispatch", "refs/tags/apps/heimdall-cli/v0.9.0", False, False),
):
    github = SimpleNamespace(event_name=event, ref=ref)
    assert evaluate(cache, github=github, inputs=SimpleNamespace(ref="")) == cached, (event, ref)
    assert accepts(publish, event, "", ref) == published, (event, ref)
print("CLI checkouts use the event commit; manual validation skips caching and publishing")
