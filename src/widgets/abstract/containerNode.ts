import { Node } from "./node";

class ContainerNode extends Node {
	private children = [];

	public refresh() {
		for (let x = 0; x < this.children.length; x++) {
			this.children[x].refresh();
		}
	}

	public append(element) {
		this.children.push(element);
	}
}

export { ContainerNode };
