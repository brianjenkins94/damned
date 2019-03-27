// tslint:disable:max-classes-per-file

import { EventEmitter } from "events";

import { terminal } from "../environment";

class MonkeyPatchedEventEmitter extends EventEmitter {
	public emit(type, ...args): any {
		if (type !== "resize") {
			super.emit("*", ...args);
		}
	}
}

class Buffer extends MonkeyPatchedEventEmitter {
	public rows = terminal.rows;
	public columns = terminal.columns;

	// Initialization

	public constructor() {
		super();

		terminal.on("keypress", (character, metadata) => {
			console.log(character, metadata);

			// Probably should look to see how blessed handles this.
			// https://github.com/chjj/blessed/blob/master/lib/keys.js#L134
			if (metadata["ctrl"] === true) {
				return this.emit("keypress", "C-" + character);
			} else if (metadata["shift"] === true) {
				return this.emit("keypress", "S-" + character);
			} else if (metadata["meta"] === true) {
				return this.emit("keypress", "M-" + character);
			} else {
				return this.emit("keypress", character);
			}
		});

		terminal.on("resize", () => {
			return this.emit("resize");
		});
	}

	// Alternate buffer

	public enableAlternateBuffer() {
		buffer.write("\u001B[?1049h");
	}

	public disableAlternateBuffer() {
		buffer.write("\u001B]?1049h");
	}

	// Terminal

	public clearLine(direction) {
		terminal.clearLine(direction);
	}

	public clearScreenDown() {
		terminal.clearScreenDown();
	}

	public cursorTo(x, y) {
		terminal.cursorTo(x, y);
	}

	public getWindowSize() {
		terminal.getWindowSize();
	}

	public moveCursor(dx, dy) {
		terminal.moveCursor(dx, dy);
	}

	public write(text = "") {
		terminal.write(text);
	}
}

let buffer = new Buffer();

export { buffer };
