BUNDLE_DIR = ./vendor/bundle
BOOTSTRAP_DIR = ./_sass/vendor/bootstrap

#Serve Website in test environment
.PHONY: serve
serve: bootstrap node_modules bundle
	npx rollup -c --watch & JEKYLL_ENV=development bundle exec jekyll serve --drafts

.PHONY: view_prod
view_prod: build
	bundle exec jekyll serve --skip-initial-build

.PHONY: build
build: bootstrap node_modules bundle
	npx rollup -c
	./build.sh

.PHONY: bootstrap
bootstrap: $(BOOTSTRAP_DIR)

$(BOOTSTRAP_DIR): bundle
	mkdir -p $(BOOTSTRAP_DIR)
	cp -r $(BUNDLE_DIR)/ruby/2.7.0/gems/bootstrap-5.0.2/assets/stylesheets $(BOOTSTRAP_DIR)

bundle: Gemfile.lock Gemfile
	bundle config set --local path "$(BUNDLE_DIR)"
	bundle install

node_modules: package.json
	npm install

.PHONY: clean
clean:
	rm -rf _site .jekyll-cache .sass-cache
	rm -rf assets/js
