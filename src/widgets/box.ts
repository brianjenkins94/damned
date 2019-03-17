import { ContainerNode } from "./abstract/containerNode";

class Box extends ContainerNode {
	private buffer;
	private options;

	public constructor(buffer, overrides) {
		super();

		this.buffer = buffer;

		this.options = { ...this.options, ...overrides };
	}
}

export { Box };
