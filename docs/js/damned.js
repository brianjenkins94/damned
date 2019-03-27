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

var ansiEscapes = createCommonjsModule(function (module) {
const x = module.exports;
const ESC = '\u001B[';
const OSC = '\u001B]';
const BEL = '\u0007';
const SEP = ';';
const isTerminalApp = process$1.env.TERM_PROGRAM === 'Apple_Terminal';

x.cursorTo = (x, y) => {
	if (typeof x !== 'number') {
		throw new TypeError('The `x` argument is required');
	}

	if (typeof y !== 'number') {
		return ESC + (x + 1) + 'G';
	}

	return ESC + (y + 1) + ';' + (x + 1) + 'H';
};

x.cursorMove = (x, y) => {
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

x.cursorUp = count => ESC + (typeof count === 'number' ? count : 1) + 'A';
x.cursorDown = count => ESC + (typeof count === 'number' ? count : 1) + 'B';
x.cursorForward = count => ESC + (typeof count === 'number' ? count : 1) + 'C';
x.cursorBackward = count => ESC + (typeof count === 'number' ? count : 1) + 'D';

x.cursorLeft = ESC + 'G';
x.cursorSavePosition = ESC + (isTerminalApp ? '7' : 's');
x.cursorRestorePosition = ESC + (isTerminalApp ? '8' : 'u');
x.cursorGetPosition = ESC + '6n';
x.cursorNextLine = ESC + 'E';
x.cursorPrevLine = ESC + 'F';
x.cursorHide = ESC + '?25l';
x.cursorShow = ESC + '?25h';

x.eraseLines = count => {
	let clear = '';

	for (let i = 0; i < count; i++) {
		clear += x.eraseLine + (i < count - 1 ? x.cursorUp() : '');
	}

	if (count) {
		clear += x.cursorLeft;
	}

	return clear;
};

x.eraseEndLine = ESC + 'K';
x.eraseStartLine = ESC + '1K';
x.eraseLine = ESC + '2K';
x.eraseDown = ESC + 'J';
x.eraseUp = ESC + '1J';
x.eraseScreen = ESC + '2J';
x.scrollUp = ESC + 'S';
x.scrollDown = ESC + 'T';

x.clearScreen = '\u001Bc';

x.clearTerminal = process$1.platform === 'win32' ?
	`${x.eraseScreen}${ESC}0f` :
	// 1. Erases the screen (Only done in case `2` is not supported)
	// 2. Erases the whole screen including scrollback buffer
	// 3. Moves cursor to the top-left position
	// More info: https://www.real-world-systems.com/docs/ANSIcode.html
	`${x.eraseScreen}${ESC}3J${ESC}H`;

x.beep = BEL;

x.link = (text, url) => {
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

x.image = (buf, opts) => {
	opts = opts || {};

	let ret = OSC + '1337;File=inline=1';

	if (opts.width) {
		ret += `;width=${opts.width}`;
	}

	if (opts.height) {
		ret += `;height=${opts.height}`;
	}

	if (opts.preserveAspectRatio === false) {
		ret += ';preserveAspectRatio=0';
	}

	return ret + ':' + buf.toString('base64') + BEL;
};

x.iTerm = {};

x.iTerm.setCwd = cwd => OSC + '50;CurrentDir=' + (cwd || process$1.cwd()) + BEL;
});
var ansiEscapes_1 = ansiEscapes.eraseStartLine;
var ansiEscapes_2 = ansiEscapes.eraseEndLine;
var ansiEscapes_3 = ansiEscapes.eraseLine;
var ansiEscapes_4 = ansiEscapes.eraseDown;
var ansiEscapes_5 = ansiEscapes.clearScreenDown;
var ansiEscapes_6 = ansiEscapes.cursorTo;
var ansiEscapes_7 = ansiEscapes.cursorMove;

class Browser extends EventEmitter {
    constructor() {
        super();
        this.rows = xtermJs.rows;
        this.columns = xtermJs.cols;
        xtermJs.attachCustomKeyEventHandler((event) => {
            if (event.type === "keydown" && event.key !== "Control" && event.key !== "Alt" && event.key !== "Meta" && event.key !== "Shift") {
                return this.emit("keypress", event.key, {
                    "name": event.key,
                    "ctrl": event.ctrlKey,
                    "meta": event.metaKey,
                    "shift": event.shiftKey
                });
            }
        });
        xtermJs.on("resize", () => {
            return this.emit("resize");
        });
    }
    clearLine(direction) {
        switch (direction) {
            case -1:
                xtermJs.write(ansiEscapes_1);
                break;
            case 1:
                xtermJs.write(ansiEscapes_2);
                break;
            case 0:
                xtermJs.write(ansiEscapes_3);
                break;
            default:
                throw new SyntaxError("missing formal parameter (direction)");
        }
    }
    clearScreenDown() {
        xtermJs.write(ansiEscapes_4);
    }
    cursorTo(x, y) {
        if (x === undefined) {
            throw new SyntaxError("missing formal parameter (x)");
        }
        if (y === undefined) {
            throw new SyntaxError("missing formal parameter (y)");
        }
        xtermJs.write(ansiEscapes_6(x, y));
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
        xtermJs.write(ansiEscapes_7(dx, dy));
    }
    write(text) {
        xtermJs.write(text);
    }
}

// This is pretty terrible, but I can't find a better way to do it.
let Environment = typeof (process) !== "undefined" ? require("./terminal").Terminal : Browser;
let terminal = new Environment();

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
// Inspiration for this code comes from Salvatore Sanfilippo's linenoise.
// https://github.com/antirez/linenoise
// Reference:
// * http://invisible-island.net/xterm/ctlseqs/ctlseqs.html
// * http://www.3waylabs.com/nw/WWW/products/wizcon/vt220.html
// tslint:disable:cyclomatic-complexity
function* emitKeys(buffer, character) {
    throw new Error("Not yet implemented.");
    while (true) {
        let ch = yield;
        let s = ch;
        let escaped = false;
        const key = {
            "sequence": null,
            "name": undefined,
            "ctrl": false,
            "meta": false,
            "shift": false
        };
        if (ch === "\x1b") {
            escaped = true;
            s += (ch = yield);
            if (ch === "\x1b") {
                s += (ch = yield);
            }
        }
        if (escaped && (ch === "O" || ch === "[")) {
            // ansi escape sequence
            let code = ch;
            let modifier = 0;
            if (ch === "O") {
                // ESC O letter
                // ESC O modifier letter
                s += (ch = yield);
                if (ch >= "0" && ch <= "9") {
                    modifier = (ch >> 0) - 1;
                    s += (ch = yield);
                }
                code += ch;
            }
            else if (ch === "[") {
                // ESC [ letter
                // ESC [ modifier letter
                // ESC [ [ modifier letter
                // ESC [ [ num char
                s += (ch = yield);
                if (ch === "[") {
                    // \x1b[[A
                    //      ^--- escape codes might have a second bracket
                    code += ch;
                    s += (ch = yield);
                }
                /*
                 * Here and later we try to buffer just enough data to get
                 * a complete ascii sequence.
                 *
                 * We have basically two classes of ascii characters to process:
                 *
                 *
                 * 1. `\x1b[24;5~` should be parsed as { code: "[24~", modifier: 5 }
                 *
                 * This particular example is featuring Ctrl+F12 in xterm.
                 *
                 *  - `;5` part is optional, e.g. it could be `\x1b[24~`
                 *  - first part can contain one or two digits
                 *
                 * So the generic regexp is like /^\d\d?(;\d)?[~^$]$/
                 *
                 *
                 * 2. `\x1b[1;5H` should be parsed as { code: "[H", modifier: 5 }
                 *
                 * This particular example is featuring Ctrl+Home in xterm.
                 *
                 *  - `1;5` part is optional, e.g. it could be `\x1b[H`
                 *  - `1;` part is optional, e.g. it could be `\x1b[5H`
                 *
                 * So the generic regexp is like /^((\d;)?\d)?[A-Za-z]$/
                 *
                 */
                const cmdStart = s.length - 1;
                // Skip one or two leading digits
                if (ch >= "0" && ch <= "9") {
                    s += (ch = yield);
                    if (ch >= "0" && ch <= "9") {
                        s += (ch = yield);
                    }
                }
                // skip modifier
                if (ch === ";") {
                    s += (ch = yield);
                    if (ch >= "0" && ch <= "9") {
                        s += yield;
                    }
                }
                /*
                 * We buffered enough data, now trying to extract code
                 * and modifier from it
                 */
                const cmd = s.slice(cmdStart);
                let match;
                if ((match = cmd.match(/^(\d\d?)(;(\d))?([~^$])$/))) {
                    code += match[1] + match[4];
                    modifier = (match[3] || 1) - 1;
                }
                else if ((match = cmd.match(/^((\d;)?(\d))?([A-Za-z])$/))) {
                    code += match[4];
                    modifier = (match[3] || 1) - 1;
                }
                else {
                    code += cmd;
                }
            }
            // Parse the key modifier
            key.ctrl = !!(modifier & 4);
            key.meta = !!(modifier & 10);
            key.shift = !!(modifier & 1);
            key["code"] = code;
            // Parse the key itself
            switch (code) {
                /* xterm/gnome ESC O letter */
                case "OP":
                    key.name = "f1";
                    break;
                case "OQ":
                    key.name = "f2";
                    break;
                case "OR":
                    key.name = "f3";
                    break;
                case "OS":
                    key.name = "f4";
                    break;
                /* xterm/rxvt ESC [ number ~ */
                case "[11~":
                    key.name = "f1";
                    break;
                case "[12~":
                    key.name = "f2";
                    break;
                case "[13~":
                    key.name = "f3";
                    break;
                case "[14~":
                    key.name = "f4";
                    break;
                /* from Cygwin and used in libuv */
                case "[[A":
                    key.name = "f1";
                    break;
                case "[[B":
                    key.name = "f2";
                    break;
                case "[[C":
                    key.name = "f3";
                    break;
                case "[[D":
                    key.name = "f4";
                    break;
                case "[[E":
                    key.name = "f5";
                    break;
                /* common */
                case "[15~":
                    key.name = "f5";
                    break;
                case "[17~":
                    key.name = "f6";
                    break;
                case "[18~":
                    key.name = "f7";
                    break;
                case "[19~":
                    key.name = "f8";
                    break;
                case "[20~":
                    key.name = "f9";
                    break;
                case "[21~":
                    key.name = "f10";
                    break;
                case "[23~":
                    key.name = "f11";
                    break;
                case "[24~":
                    key.name = "f12";
                    break;
                /* xterm ESC [ letter */
                case "[A":
                    key.name = "up";
                    break;
                case "[B":
                    key.name = "down";
                    break;
                case "[C":
                    key.name = "right";
                    break;
                case "[D":
                    key.name = "left";
                    break;
                case "[E":
                    key.name = "clear";
                    break;
                case "[F":
                    key.name = "end";
                    break;
                case "[H":
                    key.name = "home";
                    break;
                /* xterm/gnome ESC O letter */
                case "OA":
                    key.name = "up";
                    break;
                case "OB":
                    key.name = "down";
                    break;
                case "OC":
                    key.name = "right";
                    break;
                case "OD":
                    key.name = "left";
                    break;
                case "OE":
                    key.name = "clear";
                    break;
                case "OF":
                    key.name = "end";
                    break;
                case "OH":
                    key.name = "home";
                    break;
                /* xterm/rxvt ESC [ number ~ */
                case "[1~":
                    key.name = "home";
                    break;
                case "[2~":
                    key.name = "insert";
                    break;
                case "[3~":
                    key.name = "delete";
                    break;
                case "[4~":
                    key.name = "end";
                    break;
                case "[5~":
                    key.name = "pageup";
                    break;
                case "[6~":
                    key.name = "pagedown";
                    break;
                /* putty */
                case "[[5~":
                    key.name = "pageup";
                    break;
                case "[[6~":
                    key.name = "pagedown";
                    break;
                /* rxvt */
                case "[7~":
                    key.name = "home";
                    break;
                case "[8~":
                    key.name = "end";
                    break;
                /* rxvt keys with modifiers */
                case "[a":
                    key.name = "up";
                    key.shift = true;
                    break;
                case "[b":
                    key.name = "down";
                    key.shift = true;
                    break;
                case "[c":
                    key.name = "right";
                    key.shift = true;
                    break;
                case "[d":
                    key.name = "left";
                    key.shift = true;
                    break;
                case "[e":
                    key.name = "clear";
                    key.shift = true;
                    break;
                case "[2$":
                    key.name = "insert";
                    key.shift = true;
                    break;
                case "[3$":
                    key.name = "delete";
                    key.shift = true;
                    break;
                case "[5$":
                    key.name = "pageup";
                    key.shift = true;
                    break;
                case "[6$":
                    key.name = "pagedown";
                    key.shift = true;
                    break;
                case "[7$":
                    key.name = "home";
                    key.shift = true;
                    break;
                case "[8$":
                    key.name = "end";
                    key.shift = true;
                    break;
                case "Oa":
                    key.name = "up";
                    key.ctrl = true;
                    break;
                case "Ob":
                    key.name = "down";
                    key.ctrl = true;
                    break;
                case "Oc":
                    key.name = "right";
                    key.ctrl = true;
                    break;
                case "Od":
                    key.name = "left";
                    key.ctrl = true;
                    break;
                case "Oe":
                    key.name = "clear";
                    key.ctrl = true;
                    break;
                case "[2^":
                    key.name = "insert";
                    key.ctrl = true;
                    break;
                case "[3^":
                    key.name = "delete";
                    key.ctrl = true;
                    break;
                case "[5^":
                    key.name = "pageup";
                    key.ctrl = true;
                    break;
                case "[6^":
                    key.name = "pagedown";
                    key.ctrl = true;
                    break;
                case "[7^":
                    key.name = "home";
                    key.ctrl = true;
                    break;
                case "[8^":
                    key.name = "end";
                    key.ctrl = true;
                    break;
                /* misc. */
                case "[Z":
                    key.name = "tab";
                    key.shift = true;
                    break;
                default:
                    key.name = "undefined";
                    break;
            }
        }
        else if (ch === "\r") {
            // carriage return
            key.name = "return";
        }
        else if (ch === "\n") {
            // Enter, should have been called linefeed
            key.name = "enter";
        }
        else if (ch === "\t") {
            // tab
            key.name = "tab";
        }
        else if (ch === "\b" || ch === "\x7f") {
            // backspace or ctrl+h
            key.name = "backspace";
            key.meta = escaped;
        }
        else if (ch === "\x1b") {
            // escape key
            key.name = "escape";
            key.meta = escaped;
        }
        else if (ch === " ") {
            key.name = "space";
            key.meta = escaped;
        }
        else if (!escaped && ch <= "\x1a") {
            // ctrl+letter
            key.name = String.fromCharCode(ch.charCodeAt(0) + "a".charCodeAt(0) - 1);
            key.ctrl = true;
        }
        else if (/^[0-9A-Za-z]$/.test(ch)) {
            // letter, number, shift+letter
            key.name = ch.toLowerCase();
            key.shift = /^[A-Z]$/.test(ch);
            key.meta = escaped;
        }
        else if (escaped) {
            // Escape sequence timeout
            key.name = ch.length ? undefined : "escape";
            key.meta = true;
        }
        key.sequence = s;
        if (s.length !== 0 && (key.name !== undefined || escaped)) {
            /* Named character or sequence */
            buffer.emit("keypress", escaped ? undefined : s, key);
        }
        else if (s.length === 1) {
            /* Single unnamed character, e.g. "." */
            buffer.emit("keypress", s, key);
        }
        /* Unrecognized or broken escape sequence, don't emit anything */
    }
}

// tslint:disable:max-classes-per-file
class MonkeyPatchedEventEmitter extends EventEmitter {
    emit(type, ...args) {
        if (type !== "resize") {
            super.emit("*", ...args);
        }
    }
}
class Buffer extends MonkeyPatchedEventEmitter {
    // Initialization
    constructor() {
        super();
        this.rows = terminal.rows;
        this.columns = terminal.columns;
        terminal.on("keypress", (character, metadata) => {
            return emitKeys(this, character);
        });
        terminal.on("resize", () => {
            return this.emit("resize");
        });
    }
    // Alternate buffer
    enableAlternateBuffer() {
        buffer.write("\u001B[?1049h");
    }
    disableAlternateBuffer() {
        buffer.write("\u001B]?1049h");
    }
    // Terminal
    clearLine(direction) {
        terminal.clearLine(direction);
    }
    clearScreenDown() {
        terminal.clearScreenDown();
    }
    cursorTo(x, y) {
        terminal.cursorTo(x, y);
    }
    getWindowSize() {
        terminal.getWindowSize();
    }
    moveCursor(dx, dy) {
        terminal.moveCursor(dx, dy);
    }
    write(text = "") {
        terminal.write(text);
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
            for (let x = margin.top + 1; x < buffer.rows - (margin.bottom + 1); x++) {
                buffer.cursorTo(margin.left, x);
                buffer.write(border.style.left);
                buffer.cursorTo(buffer.columns - (margin.right + 1), x);
                buffer.write(border.style.right);
            }
            buffer.cursorTo(margin.left, buffer.rows - (margin.bottom + 1));
            buffer.write(border.style.bottomLeft);
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
            return this.emit(type, ...args);
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
        this.buffer.cursorTo(this.buffer.columns, this.buffer.rows);
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
window$1.refresh();
