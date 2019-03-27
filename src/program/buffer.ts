import { EventEmitter } from "events";

import { terminal } from "../environment";
import { emitKeys } from "./keys";

class MonkeyPatchedEventEmitter extends EventEmitter {
	public emit(type, ...args): any {
		if (type !== "resize") {
			super.emit("*", ...args);
		}
	}
}

// tslint:disable-next-line:max-classes-per-file
class Buffer extends MonkeyPatchedEventEmitter {
	public rows = terminal.rows;
	public columns = terminal.columns;

	// Initialization

	public constructor() {
		super();

		terminal.on("keypress", (ch, key) => {
			emitKeys(this, ch, key);
		});

		terminal.on("resize", () => {
			this.emit("resize");
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
