import { EventEmitter } from "events";

// Monkey-patch tty.d.ts
declare module "tty" {
	interface WriteStream {
		clearLine(dir: number): void;
		clearScreenDown(): void;
		cursorTo(x: number, y: number): void;
		getWindowSize(): void;
		moveCursor(dx: number, dy: number): void;
	}
}

import * as readline from "readline";
import * as tty from "tty";

class Terminal extends EventEmitter {
	private input = process.stdin as tty.ReadStream; // new tty.ReadStream(0);
	private output = process.stdout as tty.WriteStream; // new tty.WriteStream(1);

	public rows = this.output.rows;
	public columns = this.output.columns;

	public constructor() {
		super();

		readline.emitKeypressEvents(this.input);

		this.input.setRawMode(true);

		// Unclear if this is necessary
		this.input.resume();

		this.input.on("keypress", (ch, key) => {
			this.emit("keypress", ch, key);
		});

		this.output.on("resize", () => {
			this.emit("resize");
		});
	}

	public clearLine(direction) {
		this.output.clearLine(direction);
	}

	public clearScreenDown() {
		this.output.clearScreenDown();
	}

	public cursorTo(x, y) {
		this.output.cursorTo(x, y);
	}

	public getWindowSize() {
		this.output.getWindowSize();
	}

	public moveCursor(dx, dy) {
		this.output.moveCursor(dx, dy);
	}

	public write(text) {
		this.output.write(text);
	}
}

export { Terminal };
