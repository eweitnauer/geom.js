JS_COMPILER = ./node_modules/.bin/uglifyjs

all: geom.min.js

test:
	tests/run

.INTERMEDIATE geom.js: \
	src/circle.js \
	src/matrix.js \
	src/point.js \
	src/polygon.js \
	src/convex_decomposition.js \
	src/spatial_relation_analyzer.js \
	src/vector.js \
	src/sparse_vector.js \
	src/sparse_matrix.js

geom.min.js: geom.js Makefile
	@rm -f $@
	$(JS_COMPILER) -m --preamble '// Copyright Erik Weitnauer 2014.' < $< > $@
	@chmod a-w $@

geom.js: Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@
	@chmod a-w $@

clean:
	rm -f geom*.js

.PHONY: all clean test