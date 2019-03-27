import { ContainerNode } from "./abstract/containerNode";

import * as merge from "lodash.merge";

class Window extends ContainerNode {
	private buffer;

	// Initialization

	public constructor(buffer, overrides?) {
		super();

		this.buffer = buffer;

		this.options = merge(this.options, overrides);
	}

	// Draw

	public draw() {
		// tslint:disable-next-line:no-this-assignment
		let { buffer } = this;
		let { title, margin, border } = this.options;

		if (border !== undefined && border.style !== undefined) {
			buffer.cursorTo(margin.left, margin.top);

			buffer.write(border.style.topLeft);

			let count = 0;
			for (let x = margin.left + border.left; x < buffer.columns - (margin.right + 1); x++) {
				if (x === (margin.left + border.left) + Math.floor(((buffer.columns - (margin.right + 1) - (margin.left + border.left)) / 2) - (title.length / 2))) {
					buffer.write(title);

					x += title.length - 1;
				} else {
					buffer.write(border.style.top);
				}
			}

			buffer.write(border.style.topRight);

			for (let x = margin.top + 1; x < buffer.rows - (margin.bottom + 1); x++) {
				buffer.cursorTo(margin.left, x);

				buffer.write(border.style.left);

				buffer.cursorTo(buffer.columns - (margin.right + 1), x);

				buffer.write(border.style.right);
			}

			buffer.cursorTo(margin.left, buffer.rows - (margin.bottom + 1));

			buffer.write(border.style.bottomLeft);

			for (let x = margin.left + border.left; x < buffer.columns - (margin.right + 1); x++) {
				buffer.write(border.style.bottom);
			}

			buffer.write(border.style.bottomRight);

			buffer.cursorTo(buffer.columns, buffer.rows);
		}
	}
}

export { Window };
