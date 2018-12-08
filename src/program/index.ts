import { Window } from "./window";

import { EventEmitter } from "events";

class Program extends EventEmitter {
	private options = {
		"useAlternate": true
	};
	private terminal;
	private windows = [{"x": 0, "y": 0, "window": new Window({ "name": "STDSCR" })}];

	// Initialization

	public constructor(terminal, overrides?) {
		super();

		this.options = { ...this.options, ...overrides };

		this.terminal = terminal;

		if (this.options["useAlternate"] === true) {
			this.terminal.write("\u001B[?1049h");
		}

		this.terminal.on("keypress", function(character, metadata) {
			console.log(character);
			console.log(metadata);
		});

		this.terminal.on("resize", function(data) {
			//this.refresh();
		});
	}

	public refresh() {
		for (let x = 0; x < this.windows.length; x++) {
			//this.windows[x]["window"].refresh();
		}
	}

	public destroy() {
		this.terminal.write("\u001B]?1049h");
	}

	// Window

	public newWindow(x, y, name, overrides?) {
		this.windows.push({ "x": x, "y": y, "window": new Window(name, overrides)});

		return name;
	}

	public removeWindowByName(name) {
		this.windows.splice(this.getWindowIndexByName(name), 1);
	}

	public getWindowByName(name) {
		for (let x = 0; x < this.windows.length; x++) {
			if (this.windows[x]["window"].getName() === name) {
				return this.windows[x]["window"];
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

	// Utilities

	private getWindowIndexByName(name) {
		for (let x = 0; x < this.windows.length; x++) {
			if (this.windows[x]["window"].getName() === name) {
				return x;
			}
		}
	}
}

export { Program };
