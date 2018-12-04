let environment;

if (typeof(process) !== "undefined") {
	environment = "./terminal";
} else {
	environment = "./environment/browser.js";
}

let terminalInstance = import(environment).then(function({ Terminal }) {
	return new Terminal();
});

console.log("From environment/index: ");
console.log(terminalInstance);

export { terminalInstance };
