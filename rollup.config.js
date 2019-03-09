import commonJs from "rollup-plugin-commonjs";
import nodeBuiltins from "rollup-plugin-node-builtins";
import nodeGlobals from "rollup-plugin-node-globals";
import nodeResolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";

export default {
	"input": "examples/grid.ts",
	"output": {
		"file": "docs/js/damned.js",
		"format": "es"
	},
	"plugins": [
		commonJs({
			"namedExports": {
				"ansi-escapes": ["eraseStartLine", "eraseEndLine", "eraseLine", "eraseDown", "clearScreenDown", "cursorTo", "cursorMove"]
			}
		}),
		nodeBuiltins(),
		nodeGlobals(),
		nodeResolve(),
		typescript({
			"tsconfigOverride": {
				"compilerOptions": {
					"module": "esNext",
					"target": "ES2015"
				}
			}
		})
	],
	"watch": {
		"clearScreen": false
	}
}
