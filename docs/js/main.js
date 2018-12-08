"use strict";

let xtermJs;

document.addEventListener("DOMContentLoaded", function(event) {

	Terminal.applyAddon(fit);

	xtermJs = new Terminal({
		"allowTransparency": true,
		"theme": {
			"background": "rgba(0, 0, 0, 0.85)"
		}
	});

	xtermJs.open(document.getElementById("terminal"), true);

	xtermJs.fit();

	// Load damned
	try {
		new Function("import(\"\")");
		import("./damned.js");
	} catch (error) {
		System.import(window.location.pathname + "js/damned.js");
	}

	// Handle/debounce window resize
	let resizeTimer;

	window.addEventListener("resize", function(event) {
		clearTimeout(resizeTimer);

		resizeTimer = setTimeout(function() {
			xtermJs.fit();
		}, 250);
	});

});
