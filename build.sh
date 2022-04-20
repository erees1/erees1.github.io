#!/bin/bash
set -euo pipefail


JEKYLL_ENV=production bundle exec jekyll build
echo "-> Embedding Math"
files=$(find _site -name "*.html")

# convert each file with node and embed_math.js replacing the original
for file in $files; do
    utils/tex2chtml-page.js $file > output.html
    mv output.html $file
done

echo "-> Purging CSS"
npx purgecss -c utils/purgecss.config.js -o _site/assets/css

echo "-> Minifying HTML"
npx html-minifier --file-ext html --input-dir ./_site --output-dir ./_site --minify-css --minify-js --remove-comments --collapse-whitespace --conservative-collapse --case-sensitive --no-include-auto-generated-tags

echo "-> Done build"