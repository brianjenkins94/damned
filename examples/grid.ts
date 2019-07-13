import { Damned } from "../src";

const damned = new Damned();

// Register events
damned.on("C-c", function(event) {
	damned.destroy();

	process.exit(0);
});

// Initialize a new Window
const window = damned.append(damned.create("window", {
	"title": " Grid ",
	"margin": {
		"top": 4,
		"right": 40,
		"bottom": 4,
		"left": 40
	},
	"border": {
		"top": 1,
		"right": 1,
		"bottom": 1,
		"left": 1,
		"style": {
			"top": "─",
			"topRight": "┐",
			"right": "│",
			"bottomRight": "┘",
			"bottom": "─",
			"bottomLeft": "└",
			"left": "│",
			"topLeft": "┌"
		}
	},
	"padding": {
		"top": 0,
		"right": 0,
		"bottom": 0,
		"left": 0
	}
}));

damned.refresh();
