import { EventEmitter } from "events";

// BUG: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30818
// WORKAROUND: Using `require` to avoid incorrect type definition.
let tty = require("tty");

class Terminal extends EventEmitter {
	private input = new tty.ReadStream(0);
	private output = new tty.WriteStream(1);

	public rows = this.output.rows;
	public columns = this.output.columns;

	// <Initialization>

	public constructor() {
		super();

		this.input.setRawMode(true);

		this.input.on("data", (key) => {
			this.emit("key", key);
		});

		// WORKAROUND: `resize` event would not trigger on `this.output`
		process.stdout.on("resize", () => {
			this.emit("resize");
		});
	}

	// </Initialization>

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
