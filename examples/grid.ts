import { Damned } from "../src";

let damned = new Damned();

// Register events
damned.on("C-c", function(event) {
	damned.destroy();
});

// Initialize a new Window
let window = damned.append(damned.create("window", { "name": "Grid" }));

//let box = window.append(damned.create("box"));

window.refresh();
