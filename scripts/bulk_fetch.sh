#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

POSTS_DIR="$ROOT/src/posts"
IMAGES_ROOT="$ROOT/assets/images"
CREDITS_ROOT="$ROOT/assets/credits"

mkdir -p "$IMAGES_ROOT" "$CREDITS_ROOT"

# -------- helpers --------

# Robust slugify in pure bash (ASCII transliteration best-effort)
slugify() {
  local s="$*"
  # try iconv to strip diacritics if available; otherwise just continue
  if command -v iconv >/dev/null 2>&1; then
    s="$(printf '%s' "$s" | iconv -f UTF-8 -t ASCII//TRANSLIT 2>/dev/null || printf '%s' "$s")"
  fi
  s="$(printf '%s' "$s" | tr '[:upper:]' '[:lower:]')"
  s="${s//&/ and }"
  # replace non-alnum with dashes
  s="$(printf '%s' "$s" | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
  if [ -z "$s" ]; then s="image"; fi
  printf '%s' "$s"
}

get_title() {
  # Read title from front matter (first block only)
  awk '
    BEGIN{inFM=0}
    /^---[[:space:]]*$/{inFM++; if(inFM==2) exit}
    inFM==1 && /^title:[[:space:]]*/{
      $1=""; sub(/^[[:space:]]+/,""); print; exit
    }' "$1" | sed 's/^"//; s/"$//'
}

get_date_year() {
  # Extract first 4 chars of date: YYYY-MM-DD or ISO
  local y
  y="$(awk '
    BEGIN{inFM=0}
    /^---[[:space:]]*$/{inFM++; if(inFM==2) exit}
    inFM==1 && /^date:[[:space:]]*/{
      $1=""; sub(/^[[:space:]]+/,""); print; exit
    }' "$1" | cut -c1-4)"
  if [[ -z "$y" ]]; then y="$(date +%Y)"; fi
  printf '%s' "$y"
}

has_local_image_file() {
  # Returns 0 if front matter has image: path and the file exists on disk
  local md="$1"
  local val
  val="$(awk '
    BEGIN{inFM=0}
    /^---[[:space:]]*$/{inFM++; if(inFM==2) exit}
    inFM==1 && /^image:[[:space:]]*/{
      $1=""; sub(/^[[:space:]]+/,""); print; exit
    }' "$md" | sed 's/^"//; s/"$//')"
  # empty => no
  [[ -z "$val" ]] && return 1
  # http(s) => treat as missing local
  [[ "$val" =~ ^https?:// ]] && return 1
  # local path exists?
  [[ -f "$ROOT/$val" ]]
}

# -------- main --------

# find all markdown posts (recursive), robust to spaces
while IFS= read -r -d '' MD; do
  # Skip if a valid local image file already exists (keeps going to next post)
  if has_local_image_file "$MD"; then
    echo "✓ image exists (kept): $MD"
    continue
  fi

  title="$(get_title "$MD")"
  base="$(basename "$MD" .md)"
  year="$(get_date_year "$MD")"
  query="${title:-$base}"
  slug="$(slugify "$query")"

  # Year-based paths
  img_rel="assets/images/${year}/${slug}.jpg"
  cred_rel="assets/credits/${year}/${slug}.json"

  mkdir -p "$IMAGES_ROOT/$year" "$CREDITS_ROOT/$year"

  echo "→ $MD"
  echo "   query: $query   year: $year"

  ok=0
  for provider in unsplash pexels wikimedia; do
    if "$ROOT/scripts/fetch_image.sh" "$query" "${year}/${slug}" "$provider"; then
      ok=1
      break
    else
      echo "   fallback: $provider failed; trying next…"
    fi
  done

  if [[ $ok -eq 1 ]]; then
    "$ROOT/scripts/set_front_matter_image.py" "$MD" "$img_rel" "$cred_rel"
    echo "   ✔ updated front matter with $img_rel"
  else
    echo "   ✗ no image found"
  fi

done < <(find "$POSTS_DIR" -type f -name '*.md' -print0)
