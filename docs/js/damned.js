System.register("environment/browser", ["events", "ansi-escapes"], function (exports_1, context_1) {
    "use strict";
    var events_1, ansiEscapes, Browser;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (events_1_1) {
                events_1 = events_1_1;
            },
            function (ansiEscapes_1) {
                ansiEscapes = ansiEscapes_1;
            }
        ],
        execute: function () {
            Browser = class Browser extends events_1.EventEmitter {
                // <Initialization>
                constructor() {
                    super();
                    this.rows = term.rows;
                    this.columns = term.cols;
                    term.on("data", (key) => {
                        this.emit("key", key);
                    });
                    term.on("resize", () => {
                        this.emit("resize");
                    });
                }
                // </Initialization>
                clearLine(direction) {
                    switch (direction) {
                        case -1:
                            term.write(ansiEscapes.eraseStartLine);
                            break;
                        case 1:
                            term.write(ansiEscapes.eraseEndLine);
                            break;
                        case 0:
                            term.write(ansiEscapes.eraseLine);
                            break;
                        default:
                            throw new SyntaxError("missing formal parameter (direction)");
                    }
                }
                clearScreenDown() {
                    term.write(ansiEscapes.eraseDown);
                }
                cursorTo(x, y) {
                    if (x === undefined) {
                        throw new SyntaxError("missing formal parameter (x)");
                    }
                    if (y === undefined) {
                        throw new SyntaxError("missing formal parameter (y)");
                    }
                    term.write(ansiEscapes.cursorTo(x, y));
                }
                getWindowSize() {
                    return [this.columns, this.rows];
                }
                moveCursor(dx, dy) {
                    if (dx === undefined) {
                        throw new SyntaxError("missing formal parameter (x)");
                    }
                    if (dy === undefined) {
                        throw new SyntaxError("missing formal parameter (y)");
                    }
                    term.write(ansiEscapes.cursorMove(dx, dy));
                }
                write(text) {
                    term.write(text);
                }
            };
            exports_1("Browser", Browser);
        }
    };
});
System.register("environment/terminal", ["events"], function (exports_2, context_2) {
    "use strict";
    var events_2, tty, Terminal;
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [
            function (events_2_1) {
                events_2 = events_2_1;
            }
        ],
        execute: function () {
            // BUG: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30818
            // WORKAROUND: Using `require` to avoid incorrect type definition.
            tty = require("tty");
            Terminal = class Terminal extends events_2.EventEmitter {
                // <Initialization>
                constructor() {
                    super();
                    this.input = new tty.ReadStream(0);
                    this.output = new tty.WriteStream(1);
                    this.rows = this.output.rows;
                    this.columns = this.output.columns;
                    this.input.setRawMode(true);
                    this.input.on("data", (key) => {
                        this.emit("key", key);
                    });
                    // WORKAROUND: `resize` event would not trigger on `this.output`
                    process.stdout.on("resize", () => {
                        this.emit("resize");
                    });
                }
                // </Initialization>
                clearLine(direction) {
                    this.output.clearLine(direction);
                }
                clearScreenDown() {
                    this.output.clearScreenDown();
                }
                cursorTo(x, y) {
                    this.output.cursorTo(x, y);
                }
                getWindowSize() {
                    this.output.getWindowSize();
                }
                moveCursor(dx, dy) {
                    this.output.moveCursor(dx, dy);
                }
                write(text) {
                    this.output.write(text);
                }
            };
            exports_2("Terminal", Terminal);
        }
    };
});
System.register("index", ["environment/browser", "environment/terminal"], function (exports_3, context_3) {
    "use strict";
    var browser_1, terminal_1, environment;
    var __moduleName = context_3 && context_3.id;
    return {
        setters: [
            function (browser_1_1) {
                browser_1 = browser_1_1;
            },
            function (terminal_1_1) {
                terminal_1 = terminal_1_1;
            }
        ],
        execute: function () {
            if (typeof (process) !== "undefined") {
                environment = new terminal_1.Terminal();
            }
            else {
                environment = new browser_1.Browser();
            }
            console.log("hello!");
        }
    };
});
