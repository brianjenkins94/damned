let environment;

if (typeof(process) !== "undefined") {
	environment = "./terminal";
} else {
	environment = "./environment/browser.js";
}

export default (async function() {
	return new (await import(environment)).default();
})();
