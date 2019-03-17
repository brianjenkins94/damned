import { ContainerNode } from "./abstract/containerNode";

import * as uuid from "uuid";

class Window extends ContainerNode {
	private options = {
		// Metadata
		"name": uuid.v4(),
		// Title
		"title": "",
		// Style
		"style": {
			"border": {
				"top": "─",
				"topRight": "┐",
				"right": "│",
				"bottomRight": "┘",
				"bottom": "─",
				"bottomLeft": "└",
				"left": "│",
				"topLeft": "┌"
			},
			"visibility": "visible"
		},
		// Position
		"position": {
			"top": 0,
			"right": 12,
			"bottom": 12,
			"left": 0
		}
	};

	// Initialization

	public constructor(overrides?) {
		super();

		this.options = { ...this.options, ...overrides };
	}
}

export { Window };
