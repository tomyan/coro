
TEST=tests/coro.js

test: node_modules/litmus/bin/litmus
	node --harmony node_modules/litmus/bin/litmus $(TEST)

node_modules/litmus/bin/litmus:
	npm install litmus

.PHONY: test

