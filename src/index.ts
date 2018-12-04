"use strict";

import "./environment/browser";

let term = import(typeof(process) !== "undefined" ? "./environment/terminal" : "./environment/browser").then(function() {
	console.log("Done!");
});

//term.on("key", function(data) {
// 	term.write("We heard a thing!");
//});
