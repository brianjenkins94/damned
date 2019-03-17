import { ContainerNode } from "./abstract/containerNode";

class Box extends ContainerNode {
	private buffer;

	public constructor(buffer, overrides?) {
		super();

		this.buffer = buffer;

		this.options = { ...this.options, ...overrides };
	}

	public draw() {
		console.error("Not yet implemented.");
	}
}

export { Box };
