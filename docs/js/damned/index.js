// This is pretty terrible, but I can't find a better way to do it.
let Terminal = typeof (process) !== "undefined" ? require("./terminal").default : require("./environment/browser.js").default;
var term = new Terminal();

term.on("key", function (data) {
    term.write("We heard a thing!");
});
