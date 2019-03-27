import { ContainerNode } from "./abstract/containerNode";

import * as merge from "lodash.merge";

class Box extends ContainerNode {
	private buffer;

	public constructor(buffer, overrides?) {
		super();

		this.buffer = buffer;

		this.options = merge(this.options, overrides);
	}

	public draw() {
		console.error("Not yet implemented.");
	}
}

export { Box };
