import { EventEmitter } from "../widgets/abstract/eventEmitter";

import * as readline from "readline";
import * as tty from "tty";

// Monkey-patch tty.d.ts
declare module "tty" {
	interface WriteStream {
		moveCursor(dx: number, dy: number): void;
	}
}

class Terminal extends EventEmitter {
	private readonly input = process.stdin as tty.ReadStream;
	private readonly output = process.stdout as tty.WriteStream;

	public rows = this.output.rows;
	public columns = this.output.columns;

	public constructor() {
		super();

		readline.emitKeypressEvents(this.input);

		this.input.setRawMode(true);

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
