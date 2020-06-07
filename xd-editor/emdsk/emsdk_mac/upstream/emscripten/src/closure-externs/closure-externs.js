/**
 * Copyright 2014 The Emscripten Authors.  All rights reserved.
 * Emscripten is available under two separate licenses, the MIT license and the
 * University of Illinois/NCSA Open Source License.  Both these licenses can be
 * found in the LICENSE file.
 *
 * This file contains definitions for things that we'd really rather the closure compiler *didn't* minify.
 * See http://code.google.com/p/closure-compiler/wiki/FAQ#How_do_I_write_an_externs_file
 * See also the discussion here: https://github.com/emscripten-core/emscripten/issues/1979
 *
 * The closure_compiler() method in tools/shared.py refers to this file when calling closure.
 */

// Closure externs used by library_sockfs.js

/**
 * Backported from latest closure...
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/currentScript
 */
Document.prototype.currentScript;

/**
 * Don't minify Math.*
 */
/**
 * @suppress {duplicate}
 */
var Math = {};
Math.abs = function() {};
Math.cos = function() {};
Math.sin = function() {};
Math.tan = function() {};
Math.acos = function() {};
Math.asin = function() {};
Math.atan = function() {};
Math.atan2 = function() {};
Math.exp = function() {};
Math.log = function() {};
Math.sqrt = function() {};
Math.ceil = function() {};
Math.floor = function() {};
Math.pow = function() {};
Math.imul = function() {};
Math.fround = function() {};
Math.round = function() {};
Math.min = function() {};
Math.max = function() {};
Math.clz32 = function() {};
Math.trunc = function() {};

/**
 * Atomics
 */

var Atomics = {};
Atomics.compareExchange = function() {};
Atomics.exchange = function() {};
Atomics.wait = function() {};
Atomics.notify = function() {};
Atomics.load = function() {};
Atomics.store = function() {};

/**
 * @const
 * @suppress {duplicate, checkTypes}
 */
var WebAssembly = {};
/**
 * @constructor
 * @param {!BufferSource} bytes
 */
WebAssembly.Module = function(bytes) {};
/**
 * @constructor
 * @param {!WebAssembly.Module} moduleObject
 * @param {Object=} importObject
 */
WebAssembly.Instance = function(moduleObject, importObject) {};
/** @typedef {{initial:number, maximum:(number|undefined)}} */
var MemoryDescriptor;
/**
 * @constructor
 * @param {MemoryDescriptor} memoryDescriptor
 */
WebAssembly.Memory = function(memoryDescriptor) {};
/** @typedef {{element:string, initial:number, maximum:(number|undefined)}} */
var TableDescriptor;
/**
 * @constructor
 * @param {TableDescriptor} tableDescriptor
 */
WebAssembly.Table = function(tableDescriptor) {};
/**
 * @constructor
 * @extends {Error}
 */
WebAssembly.CompileError = function() {};
/**
 * @constructor
 * @extends {Error}
 */
WebAssembly.LinkError = function() {};
/**
 * @constructor
 * @param {string=} message
 * @param {string=} fileName
 * @param {number=} lineNumber
 * @extends {Error}
 */
WebAssembly.RuntimeError = function(message, fileName, lineNumber) {};
/**
 * Note: Closure compiler does not support function overloading, omit this overload for now.
 * {function(!WebAssembly.Module, Object=):!Promise<!WebAssembly.Instance>}
 */
/**
 * @param {!BufferSource} moduleObject
 * @param {Object=} importObject
 * @return {!Promise<{module:WebAssembly.Module, instance:WebAssembly.Instance}>}
 */
WebAssembly.instantiate = function(moduleObject, importObject) {};
/**
 * @param {!Promise<!Response>|!Response} source
 * @param {Object=} importObject
 * @return {!Promise<{module:WebAssembly.Module, instance:WebAssembly.Instance}>}
 */
WebAssembly.instantiateStreaming = function(source, importObject) {};
/**
 * @param {!BufferSource} bytes
 * @return {!Promise<!WebAssembly.Module>}
 */
WebAssembly.compile = function(bytes) {};
/**
 * @param {!BufferSource} bytes
 * @return {boolean}
 */
WebAssembly.validate = function(bytes) {};
/**
 * @param {!WebAssembly.Module} moduleObject
 * @return {!Array<{name:string, kind:string}>}
 */
WebAssembly.Module.exports = function(moduleObject) {};
/**
 * @param {!WebAssembly.Module} moduleObject
 * @return {!Array<{module:string, name:string, kind:string}>}
 */
WebAssembly.Module.imports = function(moduleObject) {};
/**
 * @param {!WebAssembly.Module} moduleObject
 * @param {string} sectionName
 * @return {!Array<!ArrayBuffer>}
 */
WebAssembly.Module.customSections = function(moduleObject, sectionName) {};
/** @dict */
WebAssembly.Instance.prototype.exports;
/**
 * @param {number} delta
 * @return {number}
 */
WebAssembly.Memory.prototype.grow = function(delta) {};
/**
 * @type {!ArrayBuffer}
 */
WebAssembly.Memory.prototype.buffer;
/**
 * @param {number} delta
 * @return {number}
 */
WebAssembly.Table.prototype.grow = function(delta) {};
/**
 * @type {number}
 */
WebAssembly.Table.prototype.length;
/**
 * @param {number} index
 * @return {function(...)}
 */
WebAssembly.Table.prototype.get = function(index) {};
/**
 * @param {number} index
 * @param {?function(...)} value
 */
WebAssembly.Table.prototype.set = function(index, value) {};

/**
 * @suppress {undefinedVars}
 */
var wakaUnknownAfter;
/**
 * @suppress {undefinedVars}
 */
var wakaUnknownBefore;
/**
 * @suppress {undefinedVars}
 */
var MozBlobBuilder;

// Module loaders externs, for AMD etc.

/**
 * @param {Function} wrapper
 */
var define = function (wrapper) {};

/**
 * @type {Worker}
 */
var worker;

/**
 * @param {Object} message
 */
var onmessage = function(message) {};
var onmessageerror = function() {};

/**
 * @param {string} type
 * @param {!Function} listener
 * @param {Object|boolean=} optionsOrUseCapture
 */
var addEventListener = function (type, listener, optionsOrUseCapture) {};

/**
 * @param {string} type
 * @param {!Function} listener
 */
var removeEventListener = function (type, listener) {};

/**
 * @type {Function}
 */
var close;

// Fetch.js/Fetch Worker

/**
 * @suppress {undefinedVars}
 */
var ENVIRONMENT_IS_FETCH_WORKER;

// Due to the way MODULARIZE works, Closure is run on generated code that does not define _scriptDir,
// but only after MODULARIZE has finished, _scriptDir is injected to the generated code.
// Therefore it cannot be minified.
/**
 * @suppress {duplicate, undefinedVars}
 */
var _scriptDir;

// Closure run on asm.js uses a hack to execute only on shell code, declare externs needed for it.
/**
 * @suppress {undefinedVars}
 */
var wakaGlobal;
/**
 * @suppress {undefinedVars}
 */
var wakaEnv;
/**
 * @suppress {undefinedVars}
 */
var wakaBuffer;


// Browser externs on global window object.
var pageXOffset;
var pageYOffset;
var innerWidth;
var innerHeight;
var outerWidth;
var outerHeight;
var event;
var devicePixelRatio;

// TODO: Use Closure's multifile support and/or migrate worker.js onmessage handler to inside the MODULARIZEd block
// to be able to remove all the variables below:

// Variables that are present in both output runtime .js file/JS lib files, and worker.js, so cannot be minified because
// the names need to match:
/** @suppress {duplicate} */
var threadInfoStruct;
/** @suppress {duplicate} */
var selfThreadId;
/** @suppress {duplicate} */
var noExitRuntime;

// No BigInt in closure yet
//    https://github.com/google/closure-compiler/issues/3167
var BigInt;

// Worklet
/**
 * @constructor
 */
function Worklet() {}
/**
 * @param {string} moduleURL
 * @param {object} options
 * @return {!Promise}
 */
Worklet.prototype.addModule = function(moduleURL, options) {};

// AudioWorklet
/**
 * @constructor
 * @extends {Worklet}
 */
function AudioWorklet() {}

/** @type {?AudioWorklet} */
BaseAudioContext.prototype.audioWorklet;

// AudioWorkletProcessor
/**
 * @constructor
 */
function AudioWorkletProcessor() {}

/** @type {!MessagePort} */
AudioWorkletProcessor.prototype.port;

// AudioWorkletNodeOptions 
/**
 * @constructor
 */
function AudioWorkletNodeOptions() {}
/** @type {number} */
AudioWorkletNodeOptions.prototype.numberOfInputs;
/** @type {number} */
AudioWorkletNodeOptions.prototype.numberOfOutputs;
/** @type {!Array<number>} */
AudioWorkletNodeOptions.prototype.outputChannelCount;
/** @dict */
AudioWorkletNodeOptions.prototype.parameterData
/** @dict */
AudioWorkletNodeOptions.prototype.processorOptions;

// AudioWorkletNode
/**
 * @constructor
 * @extends {AudioNode}
 * @param {BaseAudioContext} context
 * @param {string} name
 * @param {AudioWorkletNodeOptions} options
 */
function AudioWorkletNode(context, name, options) {}
/** @type {!MessagePort} */
AudioWorkletNode.prototype.port;
/** @type {?Object<string, number>} */
AudioWorkletNode.prototype.parameters;
/** @type {EventListener|(function():(undefined))} */
AudioWorkletNode.prototype.onprocessorerror;

/*
 * AudioWorkletGlobalScope globals
 */
var registerProcessor = function(name, obj) {};
var currentFrame;
var currentTime;
var sampleRate;