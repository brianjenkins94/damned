import { ContainerNode } from "./abstract/containerNode";

import * as uuid from "uuid";

class Box extends ContainerNode {
	private buffer;
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

	public constructor(buffer, overrides?) {
		super();

		this.buffer = buffer;

		this.options = { ...this.options, ...overrides };
	}

	public draw() {
		console.error("Not yet implemented.");
	}
}

export { Box };
