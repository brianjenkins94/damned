let environment;
if (typeof (process) !== "undefined") {
    environment = "./terminal";
}
else {
    environment = "./environment/browser.js";
}
let terminalInstance = import(environment).then(function ({ Terminal }) {
    return new Terminal();
});
console.log("From environment/index: ");
console.log(terminalInstance);

var term = /*#__PURE__*/Object.freeze({
	terminalInstance: terminalInstance
});

// term.on("key", function(data) {
// 	term.write("We heard a thing!");
// });
console.log("From index: ");
console.log(term);
