import { UnstyledContainerNode } from "../widgets/abstract/unstyledContainerNode";

import { buffer } from "./buffer";

// Widgets
import { Window } from "../widgets/window";
import { Box } from "../widgets/box";

class Program extends UnstyledContainerNode {
	private buffer = buffer;
	private options = {
		"useAlternateBuffer": true
	};
	private widgets = {};

	// Initialization

	public constructor(overrides?) {
		super();

		this.options = { ...this.options, ...overrides };

		if (this.options["useAlternateBuffer"] === true) {
			this.buffer.enableAlternateBuffer();

			this.buffer.cursorTo(0, 0);

			this.buffer.clearScreenDown();
		}

		this.buffer.on("*", (type, ...args) => {
			return this.emit(type, ...args);
		});

		this.buffer.on("resize", () => {
			this.refresh();
		});

		this.register("window", Window);
		this.register("box", Box);
	}

	public destroy() {
		this.buffer.disableAlternateBuffer();
	}

	// Create

	public create(widgetName, overrides?) {
		return new this.widgets[widgetName](this.buffer, overrides);
	}

	// Register

	public register(widgetName, widgetConstructor) {
		this.widgets[widgetName] = widgetConstructor;
	}

	// Draw

	public draw() {
		this.buffer.cursorTo(this.buffer.columns, this.buffer.rows);
	}
}

export { Program };
