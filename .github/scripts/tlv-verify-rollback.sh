#!/usr/bin/env bash
set -euo pipefail

BACKUP_NAME="${1:-}"
EXPECTED_SHA="${2:-}"

BACKUPS="$HOME/tlv-github-backups"

fail() {
    echo "STOPP: $*" >&2
    exit 1
}

[[ "$BACKUP_NAME" =~ ^tlv-before-github-[0-9]{8}-[0-9]{6}\.tar\.gz$ ]] ||
    fail "Ugyldig backupnavn"

[[ "$EXPECTED_SHA" =~ ^[a-f0-9]{64}$ ]] ||
    fail "Ugyldig SHA256"

BACKUP="$BACKUPS/$BACKUP_NAME"

test -f "$BACKUP" && test ! -L "$BACKUP" ||
    fail "Backup mangler eller er en symbolsk lenke"

test -s "$BACKUP" ||
    fail "Backupfilen er tom"

echo "=== KONTROLLER BACKUP-SHA256 ==="

ACTUAL_SHA="$(sha256sum "$BACKUP" | cut -d ' ' -f1)"

[ "$ACTUAL_SHA" = "$EXPECTED_SHA" ] ||
    fail "Backupens SHA256 stemmer ikke"

echo "SHA256: OK"

echo "=== KONTROLLER ARKIVINNHOLD ==="

mapfile -t FILES < <(tar -tzf "$BACKUP")

[ "${#FILES[@]}" -eq 5 ] ||
    fail "Forventet nøyaktig fem filer"

printf '%s\n' "${FILES[@]}" |
    LC_ALL=C sort -u |
    diff -u - <(printf '%s\n' "${FILES[@]}" | LC_ALL=C sort) >/dev/null ||
    fail "Dupliserte arkivoppføringer"

JS=""
CSS=""
INDEX_COUNT=0
ROBOTS_COUNT=0
MANIFEST_COUNT=0

for FILE in "${FILES[@]}"; do
    case "$FILE" in
        index.html)
            INDEX_COUNT=$((INDEX_COUNT + 1))
            ;;
        robots.txt)
            ROBOTS_COUNT=$((ROBOTS_COUNT + 1))
            ;;
        site.webmanifest)
            MANIFEST_COUNT=$((MANIFEST_COUNT + 1))
            ;;
        assets/index-*.js)
            [[ "$FILE" =~ ^assets/index-[A-Za-z0-9_-]+\.js$ ]] ||
                fail "Ugyldig JavaScript-navn"
            [ -z "$JS" ] || fail "Flere JavaScript-filer"
            JS="$FILE"
            ;;
        assets/index-*.css)
            [[ "$FILE" =~ ^assets/index-[A-Za-z0-9_-]+\.css$ ]] ||
                fail "Ugyldig CSS-navn"
            [ -z "$CSS" ] || fail "Flere CSS-filer"
            CSS="$FILE"
            ;;
        *)
            fail "Uventet arkivoppføring"
            ;;
    esac
done

[ "$INDEX_COUNT" -eq 1 ] &&
[ "$ROBOTS_COUNT" -eq 1 ] &&
[ "$MANIFEST_COUNT" -eq 1 ] &&
[ -n "$JS" ] &&
[ -n "$CSS" ] ||
    fail "Backupens filstruktur er ufullstendig"

# Kontroller arkivet uten å legge store filer i Bash-variabler.
tar -tzf "$BACKUP" >/dev/null ||
    fail "Kunne ikke lese hele arkivet"

for FILE in "${FILES[@]}"; do
    SIZE="$(tar -xOzf "$BACKUP" "$FILE" | wc -c)"
    [ "$SIZE" -gt 0 ] ||
        fail "Tom fil i arkivet: $FILE"
done

HTML="$(tar -xOzf "$BACKUP" index.html)"

grep -Fq "$JS" <<< "$HTML" ||
    fail "index.html refererer ikke til lagret JavaScript"

grep -Fq "$CSS" <<< "$HTML" ||
    fail "index.html refererer ikke til lagret CSS"

echo "=== RESULTAT ==="
echo "ROLLBACK BACKUP VERIFIED"
echo "Backup: $BACKUP_NAME"
echo "JavaScript: $JS"
echo "CSS: $CSS"
echo "NO PRODUCTION FILES CHANGED"