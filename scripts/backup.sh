#!/usr/bin/env bash
# Backup the ARTEX database (and optionally the data directory) with rotation.
#
# Usage:
#   scripts/backup.sh [--with-data] [--keep N] [--output-dir DIR]
#
#   --with-data    also archive the bind-mounted data/ directory (worker
#                  artifacts, evidence, skills state) as a tar.gz
#   --keep N       number of db dumps to keep (default 14; data archives rotate
#                  to the same count)
#   --output-dir   where to write (default backups/, relative to the repo root)
#
# The database dump runs inside the postgres compose service, so no psql client
# is needed on the host. Restore:
#   backup_file=backups/artex-db-20261123T000000Z.sql.gz  # use the file you want to restore
#   gunzip -c "$backup_file" | docker compose exec -T postgres \
#     sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
set -euo pipefail
CDPATH= cd -- "$(dirname "$0")/.."

usage() { sed -n '2,15p' "scripts/backup.sh" | sed 's/^# \?//'; }

KEEP=14
OUTPUT_DIR="backups"
WITH_DATA=0
while [ $# -gt 0 ]; do
  case "$1" in
    --keep|--output-dir)
      case "${2:-}" in
        ''|--*) printf '%s requires a value\n' "$1" >&2; exit 2 ;;
      esac
      if [ "$1" = --keep ]; then
        KEEP="$2"
      else
        OUTPUT_DIR="$2"
      fi
      shift 2
      ;;
    --with-data) WITH_DATA=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done
# Keep the retention format as a positive decimal integer.
case "$KEEP" in (*[!0-9]*|''|0*) echo "--keep must be a positive integer" >&2; exit 2 ;; esac

mkdir -p "$OUTPUT_DIR"
TS=$(date -u +%Y%m%dT%H%M%SZ)
DB_NAME="artex-db-$TS.sql.gz"
DATA_NAME="artex-data-$TS.tar.gz"
WORK_DIR=$(mktemp -d "$OUTPUT_DIR/.artex-backup.XXXXXXXX")
trap 'rm -f "$WORK_DIR/$DB_NAME" "$WORK_DIR/$DATA_NAME" "$WORK_DIR/tar.err"; rmdir "$WORK_DIR"' EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

publish() {
  local name="$1"
  if [ -e "$OUTPUT_DIR/$name" ] || [ -L "$OUTPUT_DIR/$name" ] ||
    ! mv -n "$WORK_DIR/$name" "$OUTPUT_DIR/$name" || [ -e "$WORK_DIR/$name" ]; then
    echo "could not publish $OUTPUT_DIR/$name" >&2
    exit 1
  fi
  echo "wrote $OUTPUT_DIR/$name ($(du -h "$OUTPUT_DIR/$name" | cut -f1))"
}

if ! docker compose exec -T postgres sh -c 'exec pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > "$WORK_DIR/$DB_NAME"; then
  echo "pg_dump failed (is the stack running?)" >&2
  exit 1
fi
gzip -t "$WORK_DIR/$DB_NAME"
publish "$DB_NAME"

if [ "$WITH_DATA" -eq 1 ]; then
  # A failed tar can leave an incomplete archive behind.
  if ! tar -czf "$WORK_DIR/$DATA_NAME" data 2>"$WORK_DIR/tar.err"; then
    echo "data archive failed (run as root so container-written files are readable):" >&2
    head -5 "$WORK_DIR/tar.err" >&2
    exit 1
  fi
  publish "$DATA_NAME"
fi

prune() (
  CDPATH= cd -- "$OUTPUT_DIR"
  local pattern="$1" file
  set --
  for file in $pattern; do
    # Only generated names are safe to pass through a line-oriented sort.
    [[ "$file" =~ ^artex-(db|data)-[0-9]{8}T[0-9]{6}Z\.(sql|tar)\.gz$ ]] || continue
    [ -f "$file" ] && [ ! -L "$file" ] || continue
    set -- "$@" "$file"
  done
  [ "$#" -gt 0 ] || exit 0
  ls -1t -- "$@" | awk -v keep="$KEEP" 'NR > keep' | while IFS= read -r old; do
    echo "pruning $OUTPUT_DIR/$old"
    rm -f -- "$old"
  done
)
prune 'artex-db-*.sql.gz'
[ "$WITH_DATA" -eq 1 ] && prune 'artex-data-*.tar.gz'
echo "backup complete ($KEEP newest kept)"
