#!/bin/bash
# Check the spec's native-addon interpreter before starting an expensive build.
set -euo pipefail
spec="$(dirname "$0")/../heimdall-server.spec"
python=$(rpmspec --parse "$spec" | sed -n 's/^export npm_config_python=//p')
test -x "$python"
rpmspec --query --buildrequires "$spec" | grep -Fx "$python"
"$python" -c 'import sys; assert sys.version_info >= (3, 9), sys.version'
echo "RPM native-addon Python: $python"
