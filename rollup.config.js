import commonJs from "rollup-plugin-commonjs";
import nodeBuiltins from "rollup-plugin-node-builtins";
import nodeGlobals from "rollup-plugin-node-globals";
import nodeResolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";

export default {
	"input": {
		"index": "src/index.ts",
		"environment/browser": "src/environment/browser.ts"
	},
	"output": {
		"dir": "docs/js/damned",
		"format": "es"
	},
	"experimentalCodeSplitting": true,
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
