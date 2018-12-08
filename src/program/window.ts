class Window {
	private name;
	private options = {
		// Title
		"title": undefined,
		// Attributes
		"visibility": "visible"
	};

	public constructor(name, overrides?) {
		this.name = name;
		this.options = { ...overrides, ...this.options };
	}

	public getName() {
		return this.name;
	}
}

export { Window };
