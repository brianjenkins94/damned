var domain;

// This constructor is used to store event handlers. Instantiating this is
// faster than explicitly calling `Object.create(null)` to get a "clean" empty
// object (tested with v8 v4.9).
function EventHandlers() {}
EventHandlers.prototype = Object.create(null);

function EventEmitter() {
  EventEmitter.init.call(this);
}

// nodejs oddity
// require('events') === require('events').EventEmitter
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.usingDomains = false;

EventEmitter.prototype.domain = undefined;
EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

EventEmitter.init = function() {
  this.domain = null;
  if (EventEmitter.usingDomains) {
    // if there is an active domain, then attach to it.
    if (domain.active && !(this instanceof domain.Domain)) ;
  }

  if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
    this._events = new EventHandlers();
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events, domain;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  domain = this.domain;

  // If there is no 'error' event listener then throw.
  if (doError) {
    er = arguments[1];
    if (domain) {
      if (!er)
        er = new Error('Uncaught, unspecified "error" event');
      er.domainEmitter = this;
      er.domain = domain;
      er.domainThrown = false;
      domain.emit('error', er);
    } else if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
    // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
    // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = new EventHandlers();
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] = prepend ? [listener, existing] :
                                          [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
                            existing.length + ' ' + type + ' listeners added. ' +
                            'Use emitter.setMaxListeners() to increase limit');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        emitWarning(w);
      }
    }
  }

  return target;
}
function emitWarning(e) {
  typeof console.warn === 'function' ? console.warn(e) : console.log(e);
}
EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function _onceWrap(target, type, listener) {
  var fired = false;
  function g() {
    target.removeListener(type, g);
    if (!fired) {
      fired = true;
      listener.apply(target, arguments);
    }
  }
  g.listener = listener;
  return g;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || (list.listener && list.listener === listener)) {
        if (--this._eventsCount === 0)
          this._events = new EventHandlers();
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length; i-- > 0;) {
          if (list[i] === listener ||
              (list[i].listener && list[i].listener === listener)) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (list.length === 1) {
          list[0] = undefined;
          if (--this._eventsCount === 0) {
            this._events = new EventHandlers();
            return this;
          } else {
            delete events[type];
          }
        } else {
          spliceOne(list, position);
        }

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = new EventHandlers();
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = new EventHandlers();
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        for (var i = 0, key; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = new EventHandlers();
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        do {
          this.removeListener(type, listeners[listeners.length - 1]);
        } while (listeners[0]);
      }

      return this;
    };

EventEmitter.prototype.listeners = function listeners(type) {
  var evlistener;
  var ret;
  var events = this._events;

  if (!events)
    ret = [];
  else {
    evlistener = events[type];
    if (!evlistener)
      ret = [];
    else if (typeof evlistener === 'function')
      ret = [evlistener.listener || evlistener];
    else
      ret = unwrapListeners(evlistener);
  }

  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, i) {
  var copy = new Array(i);
  while (i--)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

class MonkeyPatchedEventEmitter extends EventEmitter {
    emit(type, ...args) {
        super.emit("*", ...args);
        super.emit(type, ...args);
    }
}
// tslint:disable-next-line:max-classes-per-file
class UnstyledContainerNode extends MonkeyPatchedEventEmitter {
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
ansiEscapes.cursorSavePosition = ESC + ('s');
ansiEscapes.cursorRestorePosition = ESC + ('u');
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

ansiEscapes.clearTerminal = `${ansiEscapes.eraseScreen}${ESC}3J${ESC}H`;

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
let Environment = typeof (process) !== "undefined" ? require("./terminal").Terminal : Browser;
let terminal = new Environment();

// tslint:disable-next-line:cyclomatic-complexity
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

class MonkeyPatchedEventEmitter$1 extends EventEmitter {
    emit(type, ...args) {
        if (type !== "resize") {
            super.emit("*", ...args);
        }
    }
}
// tslint:disable-next-line:max-classes-per-file
class Buffer extends MonkeyPatchedEventEmitter$1 {
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
        for (let x = 0; x < text.length; x++, this.cursor.x += 1) {
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
let buffer = new Buffer();

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
        // tslint:disable-next-line:no-this-assignment
        let { buffer } = this;
        let { title, margin, border } = this.options;
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

let damned = new Program();
// Register events
damned.on("C-c", function (event) {
    damned.destroy();
    process.exit(0);
});
// Initialize a new Window
let window$1 = damned.append(damned.create("window", {
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
