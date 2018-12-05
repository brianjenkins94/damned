"use strict";

import { terminal as term } from "./environment";

term.on("key", function(data) {
	term.write("We heard a thing! ");
});

term.on("resize", function(data) {
	term.write("We heard a resize! ");
});
