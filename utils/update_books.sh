#!/bin/bash
set -euxo pipefail

web_books_path=_pages/books.md
obsidian_books_path=~/git/md-notes/personal/Books.md

# Extract front matter from current file
while read line; do
  if [[ $line == "# Books" ]]; then
    break
  else
    echo $line
  fi
done < $web_books_path > $web_books_path.tmp

# Ignore asterixed bullets and stuff after | 
tail -n +5 $obsidian_books_path | head -n 3 >> $web_books_path.tmp
tail -n +5 $obsidian_books_path | awk -F '|' '{print $2}' \
  | awk '{$1=$1};1' | grep -v '^-*$'| grep -v '.*\*$' \
  | grep -v '^Book$' | sed 's/^/- /g' >> $web_books_path.tmp 
mv $web_books_path.tmp $web_books_path
