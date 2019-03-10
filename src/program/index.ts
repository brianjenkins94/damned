import { ContainerNode } from "../widgets/abstract/containerNode";

import { buffer } from "./buffer";

// Widgets
import { Window } from "../widgets/window";
import { Box } from "../widgets/box";

class Program extends ContainerNode {
	public static Window = Window;
	public static Box = Box;

	private options = {
		"useAlternateBuffer": true
	};
	private windows = [new Window({ "name": "STDSCR" })];

	// Initialization

	public constructor(overrides?) {
		super();

		this.options = { ...this.options, ...overrides };

		if (this.options["useAlternateBuffer"] === true) {
			buffer.enableAlternateBuffer();
		}

		buffer.on("*", (type, sequence) => {
			this.emit("keypress");
		});

		buffer.on("resize", () => {
			super.refresh();
		});
	}

	public destroy() {
		buffer.disableAlternateBuffer();
	}

	// Window

	public removeWindowByName(name) {
		this.windows.splice(this.getWindowIndexByName(name), 1);
	}

	public getWindowByName(name) {
		for (let x = 0; x < this.windows.length; x++) {
			if (this.windows[x].getName() === name) {
				return this.windows[x];
			}
		}
	}

	public bringWindowToFront(name) {
		this.windows.unshift(this.windows.splice(this.getWindowIndexByName(name), 1)[0]);
	}

	public sendWindowToBack(name) {
		this.windows.push(this.windows.splice(this.getWindowIndexByName(name), 1)[0]);
	}

	public bringWindowForward(name) {
		let index = this.getWindowIndexByName(name);

		this.windows.splice(index - 1, 0, this.windows.splice(index, 1)[0]);
	}

	public sendWindowBackward(name) {
		let index = this.getWindowIndexByName(name);

		this.windows.splice(index + 1, 0, this.windows.splice(index, 1)[0]);
	}

	// Window Utilities

	private getWindowIndexByName(name) {
		for (let x = 0; x < this.windows.length; x++) {
			if (this.windows[x].getName() === name) {
				return x;
			}
		}
	}
}

export { Program };
