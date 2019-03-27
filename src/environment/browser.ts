// WORKAROUND: Couldn't get `xterm` to resolve its type definitions correctly.
declare let xtermJs;

import { EventEmitter } from "events";

import * as ansiEscapes from "ansi-escapes";

class Browser extends EventEmitter {
	public rows = xtermJs.rows;
	public columns = xtermJs.cols;

	public constructor() {
		super();

		xtermJs.attachCustomKeyEventHandler((event) => {
			if (event.type === "keydown" && event.key !== "Control" && event.key !== "Alt" && event.key !== "Meta" && event.key !== "Shift") {
				return this.emit("keypress", event.key, {
					"name": event.key,
					"ctrl": event.ctrlKey,
					"meta": event.metaKey,
					"shift": event.shiftKey
				});
			}
		});

		xtermJs.on("resize", () => {
			return this.emit("resize");
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
