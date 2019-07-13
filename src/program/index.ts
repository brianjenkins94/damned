import { UnstyledContainerNode } from "../widgets/abstract/unstyledContainerNode";

import { buffer } from "./buffer";
import { merge } from "../utilities";

// Widgets
import { Window } from "../widgets/window";
import { Box } from "../widgets/box";

class Program extends UnstyledContainerNode {
	private readonly buffer = buffer;
	private readonly options = {
		"useAlternateBuffer": true
	};
	private readonly widgets = {};

	// Initialization

	public constructor(overrides?) {
		super();

		this.options = merge(this.options, overrides);

		if (this.options["useAlternateBuffer"] === true) {
			this.buffer.enableAlternateBuffer();

			this.buffer.cursorTo(0, 0);

			this.buffer.clearScreenDown();
		}

		this.buffer.on("*", (type, ...args) => {
			this.emit(type, ...args);
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
		this.buffer.flush();
	}
}

export { Program };
