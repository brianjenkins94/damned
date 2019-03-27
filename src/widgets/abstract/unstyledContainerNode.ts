import { EventEmitter } from "events";

class MonkeyPatchedEventEmitter extends EventEmitter {
	public emit(type, ...args): any {
		super.emit("*", ...args);
	}
}

// tslint:disable-next-line:max-classes-per-file
abstract class UnstyledContainerNode extends MonkeyPatchedEventEmitter {
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
