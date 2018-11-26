"use strict";

let Terminal = require("./terminal");

Terminal.on("key", function(data) {
	Terminal.write("We heard a thing!");
});
