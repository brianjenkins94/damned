import { terminal } from "../environment";

import { Window } from "../widgets/window";
import { Box } from "../widgets/box";

import { ContainerNode } from "../widgets/abstract/containerNode";

class Program extends ContainerNode {
	public static Window = Window;
	public static Box = Box;

	private options = {
		"useAlternateBuffer": true
	};
	private terminal = terminal;
	private windows = [new Window({ "name": "STDSCR" })];

	// Initialization

	public constructor(overrides?) {
		super();

		this.options = { ...this.options, ...overrides };

		this.terminal = terminal;

		if (this.options["useAlternateBuffer"] === true) {
			this.terminal.write("\u001B[?1049h");
		}

		this.terminal.on("keypress", (character, metadata) => {
			this.emit("keypress");
		});

		this.terminal.on("resize", () => {
			super.refresh();
		});
	}

	public destroy() {
		this.terminal.write("\u001B]?1049h");
	}

	// Terminal

	public clearLine(direction) {
		this.terminal.clearLine(direction);
	}

	public clearScreenDown() {
		this.terminal.clearScreenDown();
	}

	public cursorTo(x, y) {
		this.terminal.cursorTo(x, y);
	}

	public getWindowSize() {
		this.terminal.getWindowSize();
	}

	public moveCursor(dx, dy) {
		this.terminal.moveCursor(dx, dy);
	}

	public write(text) {
		this.terminal.write(text);
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
