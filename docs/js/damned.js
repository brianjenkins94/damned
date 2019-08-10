// https://gist.github.com/mudge/5830382#gistcomment-2658721
class EventEmitter {
    constructor() {
        this.events = {};
    }
    on(event, listener) {
        if (this.events[event] === undefined) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        return function () {
            this.removeListener(event, listener);
        };
    }
    off(event, listener) {
        if (event === undefined && listener === undefined) {
            this.events = {};
        }
        else if (listener === undefined) {
            delete this.events[event];
        }
        else if (this.events[event].indexOf(listener) !== -1) {
            this.events[event].splice(this.events[event].indexOf(listener), 1);
        }
    }
    emit(event, ...args) {
        if (this.events[event] !== undefined) {
            for (const listener of this.events[event]) {
                listener(...args);
            }
        }
        if (event !== "*") {
            this.emit("*", ...args);
        }
    }
    once(event, listener) {
        return this.on(event, () => {
            this.emit(event);
            this.off(event, listener);
        });
    }
}

class UnstyledContainerNode extends EventEmitter {
    constructor() {
        super(...arguments);
        this.children = [];
    }
    refresh() {
        for (let x = 0; x < this.children.length; x++) {
            this.children[x].refresh();
        }
        this.draw();
    }
    append(element) {
        this.children.push(element);
        return element;
    }
}

var global$1 = (typeof global !== "undefined" ? global :
            typeof self !== "undefined" ? self :
            typeof window !== "undefined" ? window : {});

// shim for using process in browser
// based off https://github.com/defunctzombie/node-process/blob/master/browser.js

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
var cachedSetTimeout = defaultSetTimout;
var cachedClearTimeout = defaultClearTimeout;
if (typeof global$1.setTimeout === 'function') {
    cachedSetTimeout = setTimeout;
}
if (typeof global$1.clearTimeout === 'function') {
    cachedClearTimeout = clearTimeout;
}

function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}
function nextTick(fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
}
// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
var title = 'browser';
var platform = 'browser';
var browser = true;
var env = {};
var argv = [];
var version = ''; // empty string to avoid regexp issues
var versions = {};
var release = {};
var config = {};

function noop() {}

var on = noop;
var addListener = noop;
var once = noop;
var off = noop;
var removeListener = noop;
var removeAllListeners = noop;
var emit = noop;

function binding(name) {
    throw new Error('process.binding is not supported');
}

function cwd () { return '/' }
function chdir (dir) {
    throw new Error('process.chdir is not supported');
}function umask() { return 0; }

// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
var performance = global$1.performance || {};
var performanceNow =
  performance.now        ||
  performance.mozNow     ||
  performance.msNow      ||
  performance.oNow       ||
  performance.webkitNow  ||
  function(){ return (new Date()).getTime() };

// generate timestamp or delta
// see http://nodejs.org/api/process.html#process_process_hrtime
function hrtime(previousTimestamp){
  var clocktime = performanceNow.call(performance)*1e-3;
  var seconds = Math.floor(clocktime);
  var nanoseconds = Math.floor((clocktime%1)*1e9);
  if (previousTimestamp) {
    seconds = seconds - previousTimestamp[0];
    nanoseconds = nanoseconds - previousTimestamp[1];
    if (nanoseconds<0) {
      seconds--;
      nanoseconds += 1e9;
    }
  }
  return [seconds,nanoseconds]
}

var startTime = new Date();
function uptime() {
  var currentTime = new Date();
  var dif = currentTime - startTime;
  return dif / 1000;
}

var process$1 = {
  nextTick: nextTick,
  title: title,
  browser: browser,
  env: env,
  argv: argv,
  version: version,
  versions: versions,
  on: on,
  addListener: addListener,
  once: once,
  off: off,
  removeListener: removeListener,
  removeAllListeners: removeAllListeners,
  emit: emit,
  binding: binding,
  cwd: cwd,
  chdir: chdir,
  umask: umask,
  hrtime: hrtime,
  platform: platform,
  release: release,
  config: config,
  uptime: uptime
};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var ansiEscapes_1 = createCommonjsModule(function (module) {
const ansiEscapes = module.exports;
// TODO: remove this in the next major version
module.exports.default = ansiEscapes;

const ESC = '\u001B[';
const OSC = '\u001B]';
const BEL = '\u0007';
const SEP = ';';

ansiEscapes.cursorTo = (x, y) => {
	if (typeof x !== 'number') {
		throw new TypeError('The `x` argument is required');
	}

	if (typeof y !== 'number') {
		return ESC + (x + 1) + 'G';
	}

	return ESC + (y + 1) + ';' + (x + 1) + 'H';
};

ansiEscapes.cursorMove = (x, y) => {
	if (typeof x !== 'number') {
		throw new TypeError('The `x` argument is required');
	}

	let ret = '';

	if (x < 0) {
		ret += ESC + (-x) + 'D';
	} else if (x > 0) {
		ret += ESC + x + 'C';
	}

	if (y < 0) {
		ret += ESC + (-y) + 'A';
	} else if (y > 0) {
		ret += ESC + y + 'B';
	}

	return ret;
};

ansiEscapes.cursorUp = (count = 1) => ESC + count + 'A';
ansiEscapes.cursorDown = (count = 1) => ESC + count + 'B';
ansiEscapes.cursorForward = (count = 1) => ESC + count + 'C';
ansiEscapes.cursorBackward = (count = 1) => ESC + count + 'D';

ansiEscapes.cursorLeft = ESC + 'G';
ansiEscapes.cursorSavePosition = ESC + ( 's');
ansiEscapes.cursorRestorePosition = ESC + ( 'u');
ansiEscapes.cursorGetPosition = ESC + '6n';
ansiEscapes.cursorNextLine = ESC + 'E';
ansiEscapes.cursorPrevLine = ESC + 'F';
ansiEscapes.cursorHide = ESC + '?25l';
ansiEscapes.cursorShow = ESC + '?25h';

ansiEscapes.eraseLines = count => {
	let clear = '';

	for (let i = 0; i < count; i++) {
		clear += ansiEscapes.eraseLine + (i < count - 1 ? ansiEscapes.cursorUp() : '');
	}

	if (count) {
		clear += ansiEscapes.cursorLeft;
	}

	return clear;
};

ansiEscapes.eraseEndLine = ESC + 'K';
ansiEscapes.eraseStartLine = ESC + '1K';
ansiEscapes.eraseLine = ESC + '2K';
ansiEscapes.eraseDown = ESC + 'J';
ansiEscapes.eraseUp = ESC + '1J';
ansiEscapes.eraseScreen = ESC + '2J';
ansiEscapes.scrollUp = ESC + 'S';
ansiEscapes.scrollDown = ESC + 'T';

ansiEscapes.clearScreen = '\u001Bc';

ansiEscapes.clearTerminal = 
	// 1. Erases the screen (Only done in case `2` is not supported)
	// 2. Erases the whole screen including scrollback buffer
	// 3. Moves cursor to the top-left position
	// More info: https://www.real-world-systems.com/docs/ANSIcode.html
	`${ansiEscapes.eraseScreen}${ESC}3J${ESC}H`;

ansiEscapes.beep = BEL;

ansiEscapes.link = (text, url) => {
	return [
		OSC,
		'8',
		SEP,
		SEP,
		url,
		BEL,
		text,
		OSC,
		'8',
		SEP,
		SEP,
		BEL
	].join('');
};

ansiEscapes.image = (buffer, options = {}) => {
	let ret = `${OSC}1337;File=inline=1`;

	if (options.width) {
		ret += `;width=${options.width}`;
	}

	if (options.height) {
		ret += `;height=${options.height}`;
	}

	if (options.preserveAspectRatio === false) {
		ret += ';preserveAspectRatio=0';
	}

	return ret + ':' + buffer.toString('base64') + BEL;
};

ansiEscapes.iTerm = {
	setCwd: (cwd = process$1.cwd()) => `${OSC}50;CurrentDir=${cwd}${BEL}`
};
});
var ansiEscapes_2 = ansiEscapes_1.eraseStartLine;
var ansiEscapes_3 = ansiEscapes_1.eraseEndLine;
var ansiEscapes_4 = ansiEscapes_1.eraseLine;
var ansiEscapes_5 = ansiEscapes_1.eraseDown;
var ansiEscapes_6 = ansiEscapes_1.clearScreenDown;
var ansiEscapes_7 = ansiEscapes_1.cursorTo;
var ansiEscapes_8 = ansiEscapes_1.cursorMove;

class Browser extends EventEmitter {
    constructor() {
        super();
        this.rows = xtermJs.rows;
        this.columns = xtermJs.cols;
        xtermJs.attachCustomKeyEventHandler((event) => {
            if (event.type === "keydown" && event.key !== "Control" && event.key !== "Alt" && event.key !== "Meta" && event.key !== "Shift") {
                this.emit("keypress", event.key, {
                    "name": event.key,
                    "ctrl": event.ctrlKey,
                    "meta": event.metaKey,
                    "shift": event.shiftKey
                });
            }
        });
        xtermJs.on("resize", () => {
            this.emit("resize");
        });
    }
    clearLine(direction) {
        switch (direction) {
            case -1:
                xtermJs.write(ansiEscapes_2);
                break;
            case 1:
                xtermJs.write(ansiEscapes_3);
                break;
            case 0:
                xtermJs.write(ansiEscapes_4);
                break;
            default:
                throw new SyntaxError("missing formal parameter (direction)");
        }
    }
    clearScreenDown() {
        xtermJs.write(ansiEscapes_5);
    }
    cursorTo(x, y) {
        if (x === undefined) {
            throw new SyntaxError("missing formal parameter (x)");
        }
        if (y === undefined) {
            throw new SyntaxError("missing formal parameter (y)");
        }
        xtermJs.write(ansiEscapes_7(x, y));
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
        xtermJs.write(ansiEscapes_8(dx, dy));
    }
    write(text) {
        xtermJs.write(text);
    }
}

// This is pretty terrible, but I can't find a better way to do it.
const Environment = typeof (process) !== "undefined" ? require("./terminal").Terminal : Browser;
const terminal = new Environment();

// eslint-disable-next-line complexity
function emitKeys(buffer, ch = "", key) {
    if (ch.toLowerCase() === "return") {
        buffer.emit("keypress", "return", key);
    }
    else if (ch.toLowerCase() === "enter") {
        buffer.emit("keypress", "enter", key);
    }
    else if (ch.toLowerCase() === "tab") {
        buffer.emit("keypress", "tab", key);
    }
    else if (ch.toLowerCase() === "backspace") {
        buffer.emit("keypress", "backspace", key);
    }
    else if (ch.toLowerCase() === "escape") {
        buffer.emit("keypress", "escape", key);
    }
    else if (ch.toLowerCase() === "space" || ch === " ") {
        buffer.emit("keypress", "space", key);
    }
    else if (key.name === "up" || ch === "ArrowUp") {
        buffer.emit("keypress", "up", key);
    }
    else if (key.name === "down" || ch === "ArrowDown") {
        buffer.emit("keypress", "down", key);
    }
    else if (key.name === "left" || ch === "ArrowLeft") {
        buffer.emit("keypress", "left", key);
    }
    else if (key.name === "right" || ch === "ArrowRight") {
        buffer.emit("keypress", "right", key);
    }
    else if (ch.toLowerCase() === "clear") {
        buffer.emit("keypress", "clear", key);
    }
    else if (ch.toLowerCase() === "end") {
        buffer.emit("keypress", "end", key);
    }
    else if (ch.toLowerCase() === "home") {
        buffer.emit("keypress", "home", key);
    }
    else if (ch.toLowerCase() === "insert") {
        buffer.emit("keypress", "insert", key);
    }
    else if (ch.toLowerCase() === "delete") {
        buffer.emit("keypress", "delete", key);
    }
    else if (ch.toLowerCase() === "pageup") {
        buffer.emit("keypress", "pageup", key);
    }
    else if (ch.toLowerCase() === "pagedown") {
        buffer.emit("keypress", "pagedown", key);
    }
    else {
        // eslint-disable-next-line no-lonely-if
        if (key["ctrl"] === true) {
            buffer.emit("keypress", "C-" + key.name, key);
        }
        else if (key["meta"] === true) {
            buffer.emit("keypress", "M-" + key.name, key);
        }
        else {
            buffer.emit("keypress", key.name.toLowerCase(), key);
        }
    }
}

class Buffer extends EventEmitter {
    // Initialization
    constructor() {
        super();
        this.rows = terminal.rows;
        this.columns = terminal.columns;
        this.buffer = new Array(this.rows).fill(" ").map(() => new Array(this.columns).fill(" "));
        this.cursor = {
            "x": 0,
            "y": 0
        };
        terminal.on("keypress", (ch, key) => {
            emitKeys(this, ch, key);
        });
        terminal.on("resize", () => {
            this.rows = terminal.rows;
            this.columns = terminal.columns;
            this.buffer = new Array(this.rows).fill(" ").map(() => new Array(this.columns).fill(" "));
            this.emit("resize");
        });
    }
    // Alternate buffer
    enableAlternateBuffer() {
        terminal.write("\u001B[?1049h");
    }
    disableAlternateBuffer() {
        terminal.write("\u001B]?1049h");
    }
    // Terminal
    clearLine(direction) {
        switch (direction) {
            case -1:
                this.moveCursor(0, this.cursor.y);
                this.write(" ".repeat(this.cursor.x));
                break;
            case 1:
                this.write(" ".repeat(this.columns - this.cursor.x));
                break;
            case 0:
                this.moveCursor(0, this.cursor.y);
                this.write(" ".repeat(this.columns));
                break;
            default:
                throw new SyntaxError("missing formal parameter (direction)");
        }
    }
    clearScreenDown() {
        this.write(" ".repeat((this.columns - this.cursor.x) + ((this.rows - 1) * this.columns)));
    }
    cursorTo(x, y) {
        this.cursor = {
            "x": x,
            "y": y
        };
    }
    getWindowSize() {
        return [this.columns, this.rows];
    }
    moveCursor(dx, dy) {
        // FIXME: Does not line wrap
        this.cursor.x += dx;
        this.cursor.y += dy;
    }
    write(text = "") {
        // TODO: Optimize
        for (let x = 0; x < text.length; this.cursor.x += 1, x++) {
            if (this.cursor.x === this.columns) {
                this.cursorTo(this.cursor.y += 1, 0);
            }
            this.buffer[this.cursor.y][this.cursor.x] = text[x];
        }
    }
    // Buffer
    flush() {
        terminal.cursorTo(0, 0);
        terminal.write(this.buffer.flat().join(""));
    }
}
const buffer = new Buffer();

function merge(source, target) {
    if (target === undefined) {
        return source;
    }
    Object.entries(source).forEach(function ([key, value]) {
        if (target[key] === undefined) {
            target[key] = value;
        }
    });
    return target;
}

class Node extends EventEmitter {
    constructor() {
        super(...arguments);
        this.options = {
            // Title
            "title": "",
            // Style
            "style": {
                "visibility": "visible"
            },
            // Sizing
            "rows": 0,
            "columns": 0,
            // Margin
            "margin": {
                "top": 0,
                "right": 0,
                "bottom": 0,
                "left": 0
            },
            // Border
            "border": {
                "top": 0,
                "right": 0,
                "bottom": 0,
                "left": 0,
                // Border Style
                "style": {
                    "top": "─",
                    "topRight": "┐",
                    "right": "│",
                    "bottomRight": "┘",
                    "bottom": "─",
                    "bottomLeft": "└",
                    "left": "│",
                    "topLeft": "┌"
                }
            },
            // Padding
            "padding": {
                "top": 0,
                "right": 0,
                "bottom": 0,
                "left": 0
            }
        };
    }
}

class ContainerNode extends Node {
    constructor() {
        super(...arguments);
        this.children = [];
    }
    refresh() {
        for (let x = 0; x < this.children.length; x++) {
            this.children[x].refresh();
        }
        this.draw();
    }
    append(element) {
        this.children.push(element);
        return element;
    }
}

class Window extends ContainerNode {
    // Initialization
    constructor(buffer, overrides) {
        super();
        this.buffer = buffer;
        this.options = merge(this.options, overrides);
    }
    // Draw
    draw() {
        const { buffer } = this;
        const { title, margin, border } = this.options;
        if (border !== undefined && border.style !== undefined) {
            buffer.cursorTo(margin.left, margin.top);
            buffer.write(border.style.topLeft);
            // TODO: Try a more mathy approach
            for (let x = margin.left + border.left; x < buffer.columns - (margin.right + 1); x++) {
                if (x === (margin.left + border.left) + Math.floor(((buffer.columns - (margin.right + 1) - (margin.left + border.left)) / 2) - (title.length / 2))) {
                    buffer.write(title);
                    x += title.length - 1;
                }
                else {
                    buffer.write(border.style.top);
                }
            }
            buffer.write(border.style.topRight);
            // TODO: Try a more mathy approach
            for (let x = margin.top + 1; x < buffer.rows - (margin.bottom + 1); x++) {
                buffer.cursorTo(margin.left, x);
                buffer.write(border.style.left);
                buffer.cursorTo(buffer.columns - (margin.right + 1), x);
                buffer.write(border.style.right);
            }
            buffer.cursorTo(margin.left, buffer.rows - (margin.bottom + 1));
            buffer.write(border.style.bottomLeft);
            // TODO: Try a more mathy approach
            for (let x = margin.left + border.left; x < buffer.columns - (margin.right + 1); x++) {
                buffer.write(border.style.bottom);
            }
            buffer.write(border.style.bottomRight);
            buffer.cursorTo(buffer.columns, buffer.rows);
        }
    }
}

class Box extends ContainerNode {
    constructor(buffer, overrides) {
        super();
        this.buffer = buffer;
        this.options = merge(this.options, overrides);
    }
    draw() {
        console.error("Not yet implemented.");
    }
}

class Program extends UnstyledContainerNode {
    // Initialization
    constructor(overrides) {
        super();
        this.buffer = buffer;
        this.options = {
            "useAlternateBuffer": true
        };
        this.widgets = {};
        this.options = merge(this.options, overrides);
        if (this.options["useAlternateBuffer"] === true) {
            this.buffer.enableAlternateBuffer();
            this.buffer.cursorTo(0, 0);
            this.buffer.clearScreenDown();
        }
        this.buffer.on("*", (type, ...args) => {
            this.emit(type, ...args);
        });
        this.buffer.on("resize", () => {
            this.refresh();
        });
        this.register("window", Window);
        this.register("box", Box);
    }
    destroy() {
        this.buffer.disableAlternateBuffer();
    }
    // Create
    create(widgetName, overrides) {
        return new this.widgets[widgetName](this.buffer, overrides);
    }
    // Register
    register(widgetName, widgetConstructor) {
        this.widgets[widgetName] = widgetConstructor;
    }
    // Draw
    draw() {
        this.buffer.flush();
    }
}

const damned = new Program();
// Register events
damned.on("C-c", function (event) {
    damned.destroy();
    process.exit(0);
});
damned.on("*", function (event) {
    console.log(event);
});
// Initialize a new Window
const window$1 = damned.append(damned.create("window", {
    "title": " Grid ",
    "margin": {
        "top": 4,
        "right": 40,
        "bottom": 4,
        "left": 40
    },
    "border": {
        "top": 1,
        "right": 1,
        "bottom": 1,
        "left": 1,
        "style": {
            "top": "─",
            "topRight": "┐",
            "right": "│",
            "bottomRight": "┘",
            "bottom": "─",
            "bottomLeft": "└",
            "left": "│",
            "topLeft": "┌"
        }
    },
    "padding": {
        "top": 0,
        "right": 0,
        "bottom": 0,
        "left": 0
    }
}));
damned.refresh();
