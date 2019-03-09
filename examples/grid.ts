import { Damned } from "../src";

let damned = new Damned();

// Register events
damned.on("C-c", function(event) {
	damned.destroy();
});

// Initialize new Window
let window = new Damned.Window("Grid");

damned.append(window);

let box = new Damned.Box();

window.append(box);
