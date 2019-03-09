import { ContainerNode } from "./abstract/containerNode";

class Window extends ContainerNode {
	private name;
	private options = {
		// Title
		"title": "",
		// Attributes
		"visibility": "visible",
		// Positioning
		"position": {
			"top": 0,
			"right": 12,
			"bottom": 12,
			"left": 0
		}
	};

	// Initialization

	public constructor(name, overrides?) {
		super();

		this.name = name;
		this.options = { ...this.options, ...overrides };
	}

	public getName() {
		return this.name;
	}
}

export { Window };
