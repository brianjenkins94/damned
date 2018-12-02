// WORKAROUND: Couldn't get `xterm` to resolve correctly.
declare let term: any;

import { EventEmitter } from "events";

import * as ansiEscapes from "ansi-escapes";

class Browser extends EventEmitter {
	public rows = term.rows;
	public columns = term.cols;

	// <Initialization>

	public constructor() {
		super();

		term.on("data", (key) => {
			this.emit("key", key);
		});

		term.on("resize", () => {
			this.emit("resize");
		});
	}

	// </Initialization>

	public clearLine(direction) {
		switch (direction) {
			case -1:
				term.write(ansiEscapes.eraseStartLine);
				break;
			case 1:
				term.write(ansiEscapes.eraseEndLine);
				break;
			case 0:
				term.write(ansiEscapes.eraseLine);
				break;
			default:
				throw new SyntaxError("missing formal parameter (direction)");
		}
	}

	public clearScreenDown() {
		term.write(ansiEscapes.eraseDown);
	}

	public cursorTo(x, y) {
		if (x === undefined) {
			throw new SyntaxError("missing formal parameter (x)");
		}

		if (y === undefined) {
			throw new SyntaxError("missing formal parameter (y)");
		}

		term.write(ansiEscapes.cursorTo(x, y));
	}

	public getWindowSize() {
		return [this.columns, this.rows];
	}

	public moveCursor(dx, dy) {
		if (dx === undefined) {
			throw new SyntaxError("missing formal parameter (x)");
		}

		if (dy === undefined) {
			throw new SyntaxError("missing formal parameter (y)");
		}

		term.write(ansiEscapes.cursorMove(dx, dy));
	}

	public write(text) {
		term.write(text);
	}
}

export { Browser };
