import { EventEmitter } from "../../program/abstract/eventEmitter";

abstract class UnstyledContainerNode extends EventEmitter {
	protected children = [];

	public refresh() {
		for (let x = 0; x < this.children.length; x++) {
			this.children[x].refresh();
		}

		this.draw();
	}

	public append(element) {
		this.children.push(element);

		return element;
	}

	public abstract draw();
}

export { UnstyledContainerNode };
