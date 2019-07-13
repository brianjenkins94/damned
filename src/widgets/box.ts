import { ContainerNode } from "./abstract/containerNode";

import { merge } from "../utilities";

class Box extends ContainerNode {
	private readonly buffer;

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
