JS_COMPILER = ./node_modules/.bin/uglifyjs
VERSION = v1.0.5

all: geom.min.js

geom-tiny: geom-tiny.min.js

test:
	tests/run

.INTERMEDIATE geom-tiny.js: \
	src/point.js \
	src/circle.js \
	src/polygon.js

.INTERMEDIATE geom.js: \
	src/circle.js \
	src/matrix.js \
	src/point.js \
	src/path-data-polyfill.js \
	src/polygon.js \
	src/polygon-svg.js \
	src/convex_decomposition.js \
	src/spatial_relation_analyzer.js \
	src/vector.js \
	src/sparse_vector.js \
	src/sparse_matrix.js

geom-tiny.min.js: geom-tiny.js Makefile
	@rm -f $@
	$(JS_COMPILER) -m --preamble '// Copyright Erik Weitnauer 2017. [$(VERSION)]' < $< > $@
	@chmod a-w $@

geom-tiny.js: Makefile
	@rm -f $@
	@echo '// Copyright Erik Weitnauer 2017. [$(VERSION)]' > $@
	cat $(filter %.js,$^) >> $@
	@chmod a-w $@

geom.min.js: geom.js Makefile
	@rm -f $@
	$(JS_COMPILER) -m --preamble '// Copyright Erik Weitnauer 2017. [$(VERSION)]' < $< > $@
	@chmod a-w $@

geom.js: Makefile
	@rm -f $@
	@echo '// Copyright Erik Weitnauer 2017. [$(VERSION)]' > $@
	cat $(filter %.js,$^) >> $@
	@chmod a-w $@

clean:
	rm -f geom*.js

.PHONY: all clean test
