import { EventEmitter } from "./eventEmitter";

abstract class Node extends EventEmitter {
	protected options = {
		// Title
		"title": "",

		// Style
		"style": {
			"visibility": "visible"
		},

		// Sizing
		"rows": 0,
		"columns": 0,

		// Margin
		"margin": {
			"top": 0,
			"right": 0,
			"bottom": 0,
			"left": 0
		},

		// Border
		"border": {
			"top": 0,
			"right": 0,
			"bottom": 0,
			"left": 0,

			// Border Style
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

		// Padding
		"padding": {
			"top": 0,
			"right": 0,
			"bottom": 0,
			"left": 0
		}
	};

	public abstract draw();
}

export { Node };
