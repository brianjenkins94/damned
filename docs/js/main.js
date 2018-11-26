"use strict";

let term;

document.addEventListener("DOMContentLoaded", function(event) {

	Terminal.applyAddon(fit);

	term = new Terminal({
		"allowTransparency": true,
		"theme": {
			"background": "rgba(0, 0, 0, 0.85)"
		}
 	});

	term.open(document.getElementById("terminal"), true);

	term.fit();

	// Handle/debounce window resize
	let resizeTimer;

	window.addEventListener("resize", function(event) {
		clearTimeout(resizeTimer);

		resizeTimer = setTimeout(function() {
			term.fit();
		}, 250);
	});

});
