// eslint-disable-next-line complexity
export function emitKeys(buffer, ch = "", key) {
	if (ch.toLowerCase() === "return") {
		buffer.emit("keypress", "return", key);
	} else if (ch.toLowerCase() === "enter") {
		buffer.emit("keypress", "enter", key);
	} else if (ch.toLowerCase() === "tab") {
		buffer.emit("keypress", "tab", key);
	} else if (ch.toLowerCase() === "backspace") {
		buffer.emit("keypress", "backspace", key);
	} else if (ch.toLowerCase() === "escape") {
		buffer.emit("keypress", "escape", key);
	} else if (ch.toLowerCase() === "space" || ch === " ") {
		buffer.emit("keypress", "space", key);
	} else if (key.name === "up" || ch === "ArrowUp") {
		buffer.emit("keypress", "up", key);
	} else if (key.name === "down" || ch === "ArrowDown") {
		buffer.emit("keypress", "down", key);
	} else if (key.name === "left" || ch === "ArrowLeft") {
		buffer.emit("keypress", "left", key);
	} else if (key.name === "right" || ch === "ArrowRight") {
		buffer.emit("keypress", "right", key);
	} else if (ch.toLowerCase() === "clear") {
		buffer.emit("keypress", "clear", key);
	} else if (ch.toLowerCase() === "end") {
		buffer.emit("keypress", "end", key);
	} else if (ch.toLowerCase() === "home") {
		buffer.emit("keypress", "home", key);
	} else if (ch.toLowerCase() === "insert") {
		buffer.emit("keypress", "insert", key);
	} else if (ch.toLowerCase() === "delete") {
		buffer.emit("keypress", "delete", key);
	} else if (ch.toLowerCase() === "pageup") {
		buffer.emit("keypress", "pageup", key);
	} else if (ch.toLowerCase() === "pagedown") {
		buffer.emit("keypress", "pagedown", key);
	} else {
		// eslint-disable-next-line no-lonely-if
		if (key["ctrl"] === true) {
			buffer.emit("keypress", "C-" + key.name, key);
		} else if (key["meta"] === true) {
			buffer.emit("keypress", "M-" + key.name, key);
		} else {
			buffer.emit("keypress", key.name.toLowerCase(), key);
		}
	}
}
