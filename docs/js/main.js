"use strict";

let xtermJs;

import("/js/damned/index.js");

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

	// Handle/debounce window resize
	let resizeTimer;

	window.addEventListener("resize", function(event) {
		clearTimeout(resizeTimer);

		resizeTimer = setTimeout(function() {
			xtermJs.fit();
		}, 250);
	});

});
