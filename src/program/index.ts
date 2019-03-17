import { ContainerNode } from "../widgets/abstract/containerNode";

import * as fs from "fs";
import * as path from "path";

import { buffer } from "./buffer";

class Program extends ContainerNode {
	private buffer = buffer;
	private options = {
		"useAlternateBuffer": true
	};
	private widgets = {};

	// Initialization

	public constructor(overrides?) {
		super();

		this.options = { ...this.options, ...overrides };

		if (this.options["useAlternateBuffer"] === true) {
			buffer.enableAlternateBuffer();
		}

		buffer.on("*", (type, sequence) => {
			this.emit("keypress");
		});

		buffer.on("resize", () => {
			super.refresh();
		});

		fs.readdirSync(path.join(__dirname, "..", "widgets")).forEach((file) => {
			if (fs.statSync(path.join(__dirname, "..", "widgets", file)).isFile()) {
				let widgetName = file.substring(0, file.lastIndexOf("."));
				let widgetConstructor = file[0].toUpperCase() + widgetName.substring(1);

				this.register(widgetName, require(path.join("../widgets", file))[widgetConstructor]);
			}
		});
	}

	public destroy() {
		buffer.disableAlternateBuffer();
	}

	// Create

	public create(widgetName, overrides?) {
		return new this.widgets[widgetName](this.buffer, overrides);
	}

	// Append

	public append(window: Window, overrides?) {
		this.children.push(window);

		return window;
	}

	// Register

	public register(widgetName, constructor) {
		this.widgets[widgetName] = constructor;
	}

	// Window

	public removeWindowByName(name) {
		this.children.splice(this.getWindowIndexByName(name), 1);
	}

	public getWindowByName(name) {
		for (let x = 0; x < this.children.length; x++) {
			if (this.children[x].getName() === name) {
				return this.children[x];
			}
		}
	}

	public bringWindowToFront(name) {
		this.children.unshift(this.children.splice(this.getWindowIndexByName(name), 1)[0]);
	}

	public sendWindowToBack(name) {
		this.children.push(this.children.splice(this.getWindowIndexByName(name), 1)[0]);
	}

	public bringWindowForward(name) {
		let index = this.getWindowIndexByName(name);

		this.children.splice(index - 1, 0, this.children.splice(index, 1)[0]);
	}

	public sendWindowBackward(name) {
		let index = this.getWindowIndexByName(name);

		this.children.splice(index + 1, 0, this.children.splice(index, 1)[0]);
	}

	// Window Utilities

	private getWindowIndexByName(name) {
		for (let x = 0; x < this.children.length; x++) {
			if (this.children[x].getName() === name) {
				return x;
			}
		}
	}
}

export { Program };
