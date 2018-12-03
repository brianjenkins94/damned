"use strict";

import { environment as term } from "./environment";

term.on("key", function(data) {
	term.write("We heard a thing!");
});
