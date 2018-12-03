import { Browser } from "./browser";
import { Terminal } from "./terminal";

let environment;

if (typeof(process) !== "undefined") {
	environment = new Terminal();
} else {
	environment = new Browser();
}

export { environment };
