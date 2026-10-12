#!/usr/bin/env python3
"""Exercise curl protocol allowlists without installing packages or using upstreams."""
import os
from pathlib import Path
import re
import shlex
import subprocess
import unittest

RPM = Path(__file__).resolve().parents[1]


class DownloadProtocolsTest(unittest.TestCase):
    def test_package_downloads_only_allow_https(self):
        for script in ('scripts/setup-build-deps.sh', 'tests/previous-package.sh'):
            source = (RPM / script).read_text().replace('\\\n', '')
            commands = re.findall(r'^\s*(?:\$\{SUDO\}\s+)?(curl\s+.+)$', source, re.MULTILINE)
            self.assertTrue(commands, script)
            for command in commands:
                args = shlex.split(command)
                if '|' in args:
                    args = args[:args.index('|')]
                url_index = next(i for i, arg in enumerate(args) if arg.startswith('https://'))
                for i, arg in enumerate(args[:-1]):
                    if arg in ('-o', '--output'):
                        args[i + 1] = os.devnull
                for scheme in ('http', 'file', 'https'):
                    with self.subTest(script=script, url=args[url_index], scheme=scheme):
                        call = args[:]
                        call[url_index] = ('file://' + os.devnull if scheme == 'file'
                                           else scheme + '://127.0.0.1:1/download')
                        result = subprocess.run(
                            [call[0], '--disable'] + call[1:] +
                            ['--noproxy', '*', '--connect-timeout', '1', '--max-time', '1'],
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                            universal_newlines=True)
                        # HTTPS reaches connection setup; every other scheme is rejected first.
                        self.assertEqual(result.returncode, 7 if scheme == 'https' else 1,
                                         result.stderr)


if __name__ == '__main__':
    unittest.main()
