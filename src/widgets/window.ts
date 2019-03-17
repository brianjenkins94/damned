import { ContainerNode } from "./abstract/containerNode";

import * as uuid from "uuid";

class Window extends ContainerNode {
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

	// Initialization

	public constructor(buffer, overrides?) {
		super();

		this.buffer = buffer;

		this.options = { ...this.options, ...overrides };
	}

	public draw() {
		this.buffer.cursorTo(0, 0);

		for (let x = 0; x < this.buffer.columns; x++) {
			this.buffer.write("-");
		}

		this.buffer.cursorTo(0, this.buffer.rows);

		for (let x = 0; x < this.buffer.columns; x++) {
			this.buffer.write("_");
		}
	}
}

export { Window };
