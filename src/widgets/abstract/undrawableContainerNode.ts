import { EventEmitter } from "events";

abstract class UndrawableContainerNode extends EventEmitter {
	protected children = [];

	public refresh() {
		for (let x = 0; x < this.children.length; x++) {
			this.children[x].refresh();
		}
	}

	public append(element) {
		this.children.push(element);

		return element;
	}
}

export { UndrawableContainerNode };
