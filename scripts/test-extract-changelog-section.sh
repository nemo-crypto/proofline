#!/usr/bin/env bash
# Tests scripts/extract-changelog-section.sh against a fake CHANGELOG in a temp dir.
set -euo pipefail

extract="$(cd "$(dirname "$0")" && pwd)/extract-changelog-section.sh"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

cat > "$tmp/CHANGELOG.md" <<'EOF'
# Changelog

## [1.2.30] - 2030-01-03

Not this one.

## [1.2.3] - 2030-01-02

Summary line.

### Added

- **Thing**: did a thing (#1).

## [1.2.2] - 2030-01-01

- Older entry.
EOF

expected='Summary line.

### Added

- **Thing**: did a thing (#1).'

fail=0

if out=$(bash "$extract" 1.2.3 "$tmp/CHANGELOG.md") && [ "$out" = "$expected" ]; then
  echo "PASS: section [1.2.3] found, body returned exactly"
else
  echo "FAIL: section [1.2.3]; got:"; printf '%s\n' "${out-}"
  fail=1
fi

# A relative filename containing "=" is an awk assignment if passed as an operand.
cp "$tmp/CHANGELOG.md" "$tmp/project=CHANGELOG.md"
if out=$(cd "$tmp" && bash "$extract" 1.2.3 project=CHANGELOG.md </dev/null) && [ "$out" = "$expected" ]; then
  echo "PASS: reads an assignment-shaped relative filename"
else
  echo "FAIL: did not read the requested changelog file"
  fail=1
fi

if out=$(bash "$extract" 9.9.9 "$tmp/CHANGELOG.md"); then
  echo "FAIL: missing section [9.9.9] exited 0; got:"; printf '%s\n' "$out"
  fail=1
elif [ -n "$out" ]; then
  echo "FAIL: missing section [9.9.9] printed output:"; printf '%s\n' "$out"
  fail=1
else
  echo "PASS: missing section [9.9.9] exits non-zero with no output"
fi

# A CRLF checkout can contain whitespace-only lines around, or instead of, notes.
printf '## [2.0.0]\r\n \t\r\nRelease notes.\r\n \t\r\n## [1.9.0]\r\n \t\r\n' > "$tmp/CRLF.md"

if out=$(bash "$extract" 2.0.0 "$tmp/CRLF.md") && [ "$out" = 'Release notes.' ]; then
  echo "PASS: CRLF section trims whitespace-only boundary lines"
else
  echo "FAIL: CRLF section did not return the expected notes"
  fail=1
fi

if out=$(bash "$extract" 1.9.0 "$tmp/CRLF.md") || [ -n "$out" ]; then
  echo "FAIL: whitespace-only section should exit non-zero with no output"
  fail=1
else
  echo "PASS: whitespace-only section exits non-zero with no output"
fi

cat > "$tmp/fenced.md" <<'EOF'
## [3.0.0]

~~~markdown
## [2.0.0]
~~~

## [2.0.0]

  ````markdown
```
## [1.0.0]
```
  ````

This belongs to 2.0.0.

## [1.0.0]

Older notes.
EOF

expected='  ````markdown
```
## [1.0.0]
```
  ````

This belongs to 2.0.0.'
if out=$(bash "$extract" 2.0.0 "$tmp/fenced.md") && [ "$out" = "$expected" ]; then
  echo "PASS: headings inside fenced examples do not start or end the section"
else
  echo "FAIL: fenced example confused the section extractor"; printf '%s\n' "${out-}"
  fail=1
fi

exit "$fail"
