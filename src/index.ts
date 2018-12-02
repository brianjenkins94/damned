"use strict";

// `tsc` is making me fully qualify `./environment/index`... not sure why.
//import { environment as term } from "./environment/index";

import { Browser } from "./environment/browser";
import { Terminal } from "./environment/terminal";

let environment;

if (typeof(process) !== "undefined") {
	environment = new Terminal();
} else {
	environment = new Browser();
}

console.log("hello!");

// term.on("key", function(data) {
// 	term.write("We heard a thing!");
// });
