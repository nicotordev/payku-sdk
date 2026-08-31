#!/usr/bin/env bash
# Sync wiki/ from the main repo to GitHub Wiki (payku-sdk.wiki.git).
#
# Prerequisite: create the first wiki page once in the UI so the .wiki.git repo exists:
#   https://github.com/nicotordev/payku-sdk/wiki/_new
#   Title: Home — paste content from wiki/Home.md (or any stub), then Save Page.
#
# Usage: ./scripts/sync-wiki.sh ["commit message"]

set -euo pipefail

REPO="nicotordev/payku-sdk"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WIKI_SRC="${ROOT}/wiki"
MSG="${1:-docs(wiki): sync from repo}"

if ! command -v gh >/dev/null; then
  echo "gh CLI required" >&2
  exit 1
fi

if [[ ! -d "$WIKI_SRC" ]]; then
  echo "Missing ${WIKI_SRC}" >&2
  exit 1
fi

TOKEN="$(gh auth token)"
WIKI_URL="https://x-access-token:${TOKEN}@github.com/${REPO}.wiki.git"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

if git clone "$WIKI_URL" "$WORKDIR/wiki" 2>/dev/null; then
  echo "Cloned existing wiki"
else
  cat >&2 <<EOF
Wiki git repo not found yet.

Create the first page in GitHub (one time):
  https://github.com/${REPO}/wiki/_new

1. Title: Home
2. Paste content from wiki/Home.md (or a one-line stub)
3. Save Page

Then re-run: ./scripts/sync-wiki.sh
EOF
  exit 1
fi

cp "$WIKI_SRC"/*.md "$WORKDIR/wiki/"
cd "$WORKDIR/wiki"

git config user.name "$(gh api user --jq .name 2>/dev/null || echo 'nicotordev')"
git config user.email "$(gh api user --jq .email 2>/dev/null || echo 'nicotordev@gmail.com')"

git add -A
if git diff --cached --quiet; then
  echo "Wiki already up to date."
  exit 0
fi

git commit -m "$MSG"

for branch in master main; do
  if git push -u origin "HEAD:${branch}" 2>/dev/null; then
    echo "Pushed to ${branch}"
    echo "Wiki: https://github.com/${REPO}/wiki"
    exit 0
  fi
done

echo "Push failed" >&2
exit 1
