// WORKAROUND: Couldn't get `xterm` to resolve its type definitions correctly.
declare let xtermJs: any;

import { EventEmitter } from "events";

import * as ansiEscapes from "ansi-escapes";

class Browser extends EventEmitter {
	public rows = xtermJs.rows;
	public columns = xtermJs.cols;

	public constructor() {
		super();

		// TODO: Detect and pass { sequence, name, ctrl, meta, shift }
		xtermJs.on("data", (character, metadata) => {
			this.emit("keypress", character);
		});

		xtermJs.on("resize", () => {
			this.emit("resize");
		});
	}

	public clearLine(direction) {
		switch (direction) {
			case -1:
				xtermJs.write(ansiEscapes.eraseStartLine);
				break;
			case 1:
				xtermJs.write(ansiEscapes.eraseEndLine);
				break;
			case 0:
				xtermJs.write(ansiEscapes.eraseLine);
				break;
			default:
				throw new SyntaxError("missing formal parameter (direction)");
		}
	}

	public clearScreenDown() {
		xtermJs.write(ansiEscapes.eraseDown);
	}

	public cursorTo(x, y) {
		if (x === undefined) {
			throw new SyntaxError("missing formal parameter (x)");
		}

		if (y === undefined) {
			throw new SyntaxError("missing formal parameter (y)");
		}

		xtermJs.write(ansiEscapes.cursorTo(x, y));
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

		xtermJs.write(ansiEscapes.cursorMove(dx, dy));
	}

	public write(text) {
		xtermJs.write(text);
	}
}

export { Browser };
