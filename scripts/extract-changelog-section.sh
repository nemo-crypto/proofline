#!/usr/bin/env bash
# Print the body of the CHANGELOG section "## [<version>]": the lines after that
# heading up to (not including) the next "## [" heading, with leading and
# trailing blank lines removed. The version is matched literally (no leading v).
# Exit 1 with nothing on stdout when the section is missing or empty.
#
# Usage: scripts/extract-changelog-section.sh <version> [changelog]   (default CHANGELOG.md)
set -euo pipefail

if [ $# -lt 1 ] || [ $# -gt 2 ] || [ -z "$1" ]; then
  echo "usage: $0 <version> [changelog]" >&2
  exit 2
fi
version=$1
changelog=${2:-CHANGELOG.md}

body=$(awk -v head="## [$version]" '
  { sub(/\r$/, "") } # tolerate a CRLF checkout
  !fence && index($0, "## [") == 1 {
    if (found) exit
    rest = substr($0, length(head) + 1)
    if (substr($0, 1, length(head)) == head && (rest == "" || rest ~ /^[ \t]/)) { found = 1; next }
  }
  # Ignore headings inside fenced examples, but preserve those lines in output.
  {
    line = $0
    sub(/^ ? ? ?/, "", line)
    if (match(line, /^(```+|~~~+)/)) {
      marker = substr(line, 1, 1)
      if (fence) {
        if (marker == fence && RLENGTH >= fenceLength && substr(line, RLENGTH + 1) ~ /^[[:blank:]]*$/) {
          fence = ""
        }
      } else if (marker == "~" || substr(line, RLENGTH + 1) !~ /`/) {
        fence = marker
        fenceLength = RLENGTH
      }
    }
  }
  found && /[^[:blank:]]/ { printf "%s%s\n", blank, $0; blank = ""; started = 1; next }
  found && started { blank = blank $0 "\n" }
' < "$changelog")


if [ -z "$body" ]; then
  exit 1
fi
printf '%s\n' "$body"
