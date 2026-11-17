#!/usr/bin/env bash
# Stamps the stylesheet and script links in the pages with a hash of their content
# (assets/site.css?v=1a2b3c4d). A browser then never pairs a new page with an old cached file.
# Run it before each commit that changes assets/site.css or assets/site.js.
set -euo pipefail
cd "$(dirname "$0")/.."
for file in site.css site.js; do
    hash=$(sha256sum "assets/$file" | cut -c1-8)
    sed -i -E "s#(assets/$file)(\?v=[0-9a-f]+)?\"#\1?v=$hash\"#g" index.html 404.html
done
grep -ho 'assets/site\.\(css\|js\)?v=[0-9a-f]*' index.html 404.html | sort -u
