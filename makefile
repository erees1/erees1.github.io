# Serve Website in test environment
serve:
	JEKYLL_ENV=test bundle exec jekyll serve --drafts
clean:
	rm -rf _site .jekyll-cache .sass-cache 