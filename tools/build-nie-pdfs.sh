#!/usr/bin/env bash
# Print every Newspaper in Education worksheet, plus the full workbook, to PDF
# in assets/nie/. Run `npm run dev` first (the dev server renders the NIE pages
# even while they are unlisted), then: bash tools/build-nie-pdfs.sh
set -euo pipefail
cd "$(dirname "$0")/.."

BASE="${BASE:-http://localhost:8080}"
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
mkdir -p assets/nie
# Chrome resolves --print-to-pdf against its own working directory, so pass an
# absolute path (Windows form under Git Bash).
OUT="$(cd assets/nie && (pwd -W 2>/dev/null || pwd))"

print() { # url, output file
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
    --virtual-time-budget=8000 --print-to-pdf="$2" "$1" 2>/dev/null
  echo "wrote $2"
}

for f in src/nie/worksheets/*.md; do
  slug="$(basename "$f" .md)"
  print "$BASE/about/nie/worksheets/$slug/" "$OUT/$slug.pdf"
done
print "$BASE/about/nie/workbook/" "$OUT/argosy-workbook.pdf"
