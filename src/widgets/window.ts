import { ContainerNode } from "./abstract/containerNode";

class Window extends ContainerNode {
	private buffer;

	// Initialization

	public constructor(buffer, overrides?) {
		super();

		this.buffer = buffer;

		this.options = { ...this.options, ...overrides };
	}

	public draw() {
		this.buffer.cursorTo(0, 0);

		this.buffer.write(this.options.border.style.topLeft);

		for (let x = 1; x < this.buffer.columns - 1; x++) {
			this.buffer.write(this.options.border.style.top);
		}

		this.buffer.write(this.options.border.style.topRight);

		for (let x = 1; x < this.buffer.rows - 1; x++) {
			this.buffer.cursorTo(0, x);

			this.buffer.write(this.options.border.style.left);

			this.buffer.cursorTo(this.buffer.columns - 1, x);

			this.buffer.write(this.options.border.style.right);
		}

		this.buffer.cursorTo(0, this.buffer.rows);

		this.buffer.write(this.options.border.style.bottomLeft);

		for (let x = 1; x < this.buffer.columns - 1; x++) {
			this.buffer.write(this.options.border.style.bottom);
		}

		this.buffer.write(this.options.border.style.bottomRight);

		if (this.options.title !== undefined) {
			this.buffer.cursorTo(Math.floor((this.buffer.columns / 2) - (this.options.title.length / 2)), 0);

			this.buffer.write(this.options.title);
		}

		this.buffer.cursorTo(this.buffer.columns, this.buffer.rows);
	}
}

export { Window };
