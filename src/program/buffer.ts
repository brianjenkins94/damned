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

class Buffer extends MonkeyPatchedEventEmitter {
	public rows = terminal.rows;
	public columns = terminal.columns;

	private buffer = new Array(this.rows).fill(" ").map(() => new Array(this.columns).fill(" "));
	private cursor = {
		"x": 0,
		"y": 0
	};

	// Initialization

	public constructor() {
		super();

		terminal.on("keypress", (ch, key) => {
			emitKeys(this, ch, key);
		});

		terminal.on("resize", () => {
			this.rows = terminal.rows;
			this.columns = terminal.columns;

			this.buffer = new Array(this.rows).fill(" ").map(() => new Array(this.columns).fill(" "));

			this.emit("resize");
		});
	}

	// Alternate buffer

	public enableAlternateBuffer() {
		terminal.write("\u001B[?1049h");
	}

	public disableAlternateBuffer() {
		terminal.write("\u001B]?1049h");
	}

	// Terminal

	public clearLine(direction) {
		switch (direction) {
			case -1:
				this.moveCursor(0, this.cursor.y);
				this.write(" ".repeat(this.cursor.x));
				break;
			case 1:
				this.write(" ".repeat(this.columns - this.cursor.x));
				break;
			case 0:
				this.moveCursor(0, this.cursor.y);
				this.write(" ".repeat(this.columns));
				break;
			default:
				throw new SyntaxError("missing formal parameter (direction)");
		}
	}

	public clearScreenDown() {
		this.write(" ".repeat((this.columns - this.cursor.x) + ((this.rows - 1) * this.columns)));
	}

	public cursorTo(x, y) {
		this.cursor = {
			"x": x,
			"y": y
		};
	}

	public getWindowSize() {
		return [this.columns, this.rows];
	}

	public moveCursor(dx, dy) {
		// FIXME: Does not line wrap
		this.cursor.x += dx;
		this.cursor.y += dy;
	}

	public write(text = "") {
		// TODO: Optimize
		for (let x = 0; x < text.length; x++ , this.cursor.x += 1) {
			if (this.cursor.x === this.columns) {
				this.cursorTo(this.cursor.y += 1, 0);
			}

			this.buffer[this.cursor.y][this.cursor.x] = text[x];
		}
	}

	// Buffer

	public flush() {
		terminal.cursorTo(0, 0);
		terminal.write(this.buffer.flat().join(""));
	}
}

let buffer = new Buffer();

export { buffer };
