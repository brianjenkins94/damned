import { UndrawableContainerNode } from "../widgets/abstract/undrawableContainerNode";

import { buffer } from "./buffer";

// Widgets
import { Window } from "../widgets/window";
import { Box } from "../widgets/box";

class Program extends UndrawableContainerNode {
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

		this.buffer.on("*", (type, sequence) => {
			this.emit("keypress");
		});

		this.buffer.on("resize", () => {
			super.refresh();
		});

		//fs.readdirSync(path.join(__dirname, "..", "widgets")).forEach((file) => {
		//	if (fs.statSync(path.join(__dirname, "..", "widgets", file)).isFile()) {
		//		let widgetName = file.substring(0, file.lastIndexOf("."));
		//		let widgetConstructor = file[0].toUpperCase() + widgetName.substring(1);
		//
		//		this.register(widgetName, require(path.join("../widgets", file))[widgetConstructor]);
		//	}
		//});

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

	// Append

	public append(window) {
		this.children.push(window);

		return window;
	}

	// Register

	public register(widgetName, widgetConstructor) {
		this.widgets[widgetName] = widgetConstructor;
	}

	// Window

	public removeWindowByName(name) {
		this.children.splice(this.getWindowIndexByName(name), 1);
	}

	public getWindowByName(name) {
		for (let x = 0; x < this.children.length; x++) {
			if (this.children[x].getName() === name) {
				return this.children[x];
			}
		}
	}

	public bringWindowToFront(name) {
		this.children.unshift(this.children.splice(this.getWindowIndexByName(name), 1)[0]);
	}

	public sendWindowToBack(name) {
		this.children.push(this.children.splice(this.getWindowIndexByName(name), 1)[0]);
	}

	public bringWindowForward(name) {
		let index = this.getWindowIndexByName(name);

		this.children.splice(index - 1, 0, this.children.splice(index, 1)[0]);
	}

	public sendWindowBackward(name) {
		let index = this.getWindowIndexByName(name);

		this.children.splice(index + 1, 0, this.children.splice(index, 1)[0]);
	}

	// Window Utilities

	private getWindowIndexByName(name) {
		for (let x = 0; x < this.children.length; x++) {
			if (this.children[x].getName() === name) {
				return x;
			}
		}
	}
}

export { Program };
