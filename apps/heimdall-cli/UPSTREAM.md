# CLI source provenance

Imported on 2026-10-16 from [seanlongcc/heimdall-cli](https://github.com/seanlongcc/heimdall-cli)
at commit `ea29e299ca0206519dd324c9543c74cba80c1963`.

The 84 upstream files include the Apache License, Version 2.0, in
`LICENSE.md`, which retains its original copyright and attribution notices.
The import applies the repository's tracked
`packaging/rpm/heimdall-cli-nginx.patch`, SHA-256
`29993da844f52c65fb7334a3bf7b1d4a3408efbc156ffba461f43c25fdc968f1`.
That patch adds eight files, yielding 92 imported files, including 79 Go files
and all 47 Go test files.

The setup-prompts patch is already merged in the pinned upstream commit and
was not applied again. The separate untracked root prompt patch is not an
import input.

The only import adaptations are the module path and its build, import, and
linker references, now `github.com/mitre/heimdall2/apps/heimdall-cli`, plus
this provenance document. Dependencies, checksums, and patched application
behavior are preserved.

The source URL and historical upstream links are attribution only. They are
not future build inputs; builds use this in-tree source.
