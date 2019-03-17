import { EventEmitter } from "events";

abstract class Node extends EventEmitter {
	public abstract draw();
}

export { Node };
