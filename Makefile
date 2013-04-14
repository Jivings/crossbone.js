JS_TESTER = ./node_modules/mocha/bin/mocha
JS_UGLIFY = ./node_modules/uglify-js/bin/uglifyjs

.PHONY: test benchmark

all: crossbone.min.js package.json

crossbone.js: \
  
  Makefile

%.min.js: %.js Makefile
  @rm -f $@
  $(JS_UGLIFY) $< -c -m -o $@

%.js:
  @rm -f $@
  @echo '(function(exports){' > $@
  cat $(filter %.js,$^) >> $@
  @echo '})(this);' >> $@
  @chmod a-w $@

package.json: crossbone.js src/package.js
  @rm -f $@
  node src/package.js > $@
  @chmod a-w $@

clean:
  rm -f crossbone.js crossbone.min.js package.json

test: all
  @$(JS_TESTER)