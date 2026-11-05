#!/usr/bin/env bash
set -euo pipefail

BACKUP_NAME="${1:-}"
EXPECTED_SHA="${2:-}"

BACKUPS="$HOME/tlv-github-backups"
STAGE="$HOME/tlv-github-staging/ac90e61dc456c4eaf5c4bfb4b54d4633b8b0bc92/dist"
TESTS="$HOME/tlv-rollback-tests"

fail() {
    echo "STOPP: $*" >&2
    exit 1
}

[[ "$BACKUP_NAME" =~ ^tlv-before-github-[0-9]{8}-[0-9]{6}\.tar\.gz$ ]] ||
    fail "Ugyldig backupnavn"

[[ "$EXPECTED_SHA" =~ ^[a-f0-9]{64}$ ]] ||
    fail "Ugyldig kontrollsum"

BACKUP="$BACKUPS/$BACKUP_NAME"

test -f "$BACKUP" && test ! -L "$BACKUP" ||
    fail "Backup mangler eller er en lenke"

ACTUAL_SHA="$(sha256sum "$BACKUP" | cut -d ' ' -f1)"
[ "$ACTUAL_SHA" = "$EXPECTED_SHA" ] ||
    fail "Backupens kontrollsum stemmer ikke"

test -s "$STAGE/index.html" ||
    fail "Testgrunnlaget mangler"

mapfile -t FILES < <(tar -tzf "$BACKUP")

[ "${#FILES[@]}" -eq 5 ] ||
    fail "Uventet antall arkivfiler"

JS=""
CSS=""

for FILE in "${FILES[@]}"; do
    case "$FILE" in
        index.html|robots.txt|site.webmanifest) ;;
        assets/index-*.js)
            [ -z "$JS" ] || fail "Flere JS-filer"
            [[ "$FILE" =~ ^assets/index-[A-Za-z0-9_-]+\.js$ ]] ||
                fail "Ugyldig JS-navn"
            JS="$FILE"
            ;;
        assets/index-*.css)
            [ -z "$CSS" ] || fail "Flere CSS-filer"
            [[ "$FILE" =~ ^assets/index-[A-Za-z0-9_-]+\.css$ ]] ||
                fail "Ugyldig CSS-navn"
            CSS="$FILE"
            ;;
        *) fail "Uventet arkivfil" ;;
    esac
done

[ -n "$JS" ] && [ -n "$CSS" ] ||
    fail "Ressurser mangler"

for FILE in index.html robots.txt site.webmanifest; do
    COUNT="$(printf '%s\n' "${FILES[@]}" | grep -Fxc "$FILE" || true)"
    [ "$COUNT" -eq 1 ] || fail "Manglende eller duplisert: $FILE"
done

HTML="$(tar -xOzf "$BACKUP" index.html)"
grep -Fq "$JS" <<< "$HTML" || fail "Feil JS-referanse"
grep -Fq "$CSS" <<< "$HTML" || fail "Feil CSS-referanse"

mkdir -p "$TESTS"
TEST_DIR="$(mktemp -d "$TESTS/rehearsal-XXXXXXXX")"
chmod 700 "$TEST_DIR"

SITE="$TEST_DIR/site"
RESTORE="$TEST_DIR/restore"

mkdir -p "$SITE/assets" "$RESTORE"

echo "=== OPPRETT ISOLERT TESTNETTSTED ==="

cp "$STAGE/index.html" "$SITE/index.html"

STAGE_JS="$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' "$STAGE/index.html" | head -1)"
STAGE_CSS="$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.css' "$STAGE/index.html" | head -1)"

test -n "$STAGE_JS" && test -n "$STAGE_CSS" ||
    fail "Staging-referanser mangler"

cp "$STAGE/$STAGE_JS" "$SITE/assets/"
cp "$STAGE/$STAGE_CSS" "$SITE/assets/"
cp "$STAGE/robots.txt" "$SITE/"
cp "$STAGE/site.webmanifest" "$SITE/"

echo "=== GJENOPPRETT FRA BACKUP ==="

tar -xzf "$BACKUP" -C "$RESTORE"

for FILE in "${FILES[@]}"; do
    test -s "$RESTORE/$FILE" ||
        fail "Ufullstendig gjenoppretting: $FILE"
done

# Legg tilbake ressursene først.
cp "$RESTORE/$JS" "$SITE/assets/"
cp "$RESTORE/$CSS" "$SITE/assets/"

# Deretter de øvrige filene.
cp "$RESTORE/robots.txt" "$SITE/robots.txt"
cp "$RESTORE/site.webmanifest" "$SITE/site.webmanifest"

# index.html aktiveres sist.
cp "$RESTORE/index.html" "$SITE/index.html.tlv-new"
mv "$SITE/index.html.tlv-new" "$SITE/index.html"

echo "=== VERIFISER RESULTAT ==="

for FILE in "${FILES[@]}"; do
    cmp -s "$RESTORE/$FILE" "$SITE/$FILE" ||
        fail "Gjenopprettet fil stemmer ikke: $FILE"
done

echo "ROLLBACK REHEARSAL PASSED"
echo "Sandbox: $TEST_DIR"
echo "LIVE WEBSITE UNCHANGED"