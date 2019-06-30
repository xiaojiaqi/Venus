(function (f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = f()
    } else if (typeof define === "function" && define.amd) {
        define([], f)
    } else {
        var g;
        if (typeof window !== "undefined") {
            g = window
        } else if (typeof global !== "undefined") {
            g = global
        } else if (typeof self !== "undefined") {
            g = self
        } else {
            g = this
        }
        g.Recorder = f()
    }
})(function () {
    var define, module, exports;
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a)return a(o, !0);
                    if (i)return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f
                }
                var l = n[o] = {exports: {}};
                t[o][0].call(l.exports, function (e) {
                    var n = t[o][1][e];
                    return s(n ? n : e)
                }, l, l.exports, e, t, n, r)
            }
            return n[o].exports
        }

        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++)s(r[o]);
        return s
    })({
        1: [function (require, module, exports) {
            "use strict";

            module.exports = require("./recorder").Recorder;

        }, {"./recorder": 2}], 2: [function (require, module, exports) {
            'use strict';

            var _createClass = (function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            })();

            Object.defineProperty(exports, "__esModule", {
                value: true
            });
            exports.Recorder = undefined;

            var _inlineWorker = require('inline-worker');

            var _inlineWorker2 = _interopRequireDefault(_inlineWorker);

            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {default: obj};
            }

            function _classCallCheck(instance, Constructor) {
                if (!(instance instanceof Constructor)) {
                    throw new TypeError("Cannot call a class as a function");
                }
            }

            var Recorder = exports.Recorder = (function () {
                function Recorder(source, cfg) {
                    var _this = this;

                    _classCallCheck(this, Recorder);

                    this.config = {
                        bufferLen: 4096,
                        numChannels: 2,
                        mimeType: 'audio/wav'
                    };
                    this.recording = false;
                    this.callbacks = {
                        getBuffer: [],
                        exportWAV: []
                    };

                    Object.assign(this.config, cfg);
                    this.context = source.context;
                    this.node = (this.context.createScriptProcessor || this.context.createJavaScriptNode).call(this.context, this.config.bufferLen, this.config.numChannels, this.config.numChannels);

                    this.node.onaudioprocess = function (e) {
                        if (!_this.recording) return;

                        var buffer = [];
                        for (var channel = 0; channel < _this.config.numChannels; channel++) {
                            buffer.push(e.inputBuffer.getChannelData(channel));
                        }
                        _this.worker.postMessage({
                            command: 'record',
                            buffer: buffer
                        });
                    };

                    source.connect(this.node);
                    this.node.connect(this.context.destination); //this should not be necessary

                    var self = {};
                    this.worker = new _inlineWorker2.default(function () {
                        var recLength = 0,
                            recBuffers = [],
                            sampleRate = undefined,
                            numChannels = undefined;

                        self.onmessage = function (e) {
                            switch (e.data.command) {
                                case 'init':
                                    init(e.data.config);
                                    break;
                                case 'record':
                                    record(e.data.buffer);
                                    break;
                                case 'exportWAV':
                                    exportWAV(e.data.type);
                                    break;
                                case 'getBuffer':
                                    getBuffer();
                                    break;
                                case 'clear':
                                    clear();
                                    break;
                            }
                        };

                        function init(config) {
                            console.log("init(config)",  config);
                            sampleRate = config.sampleRate;
                            numChannels = config.numChannels;
                            initBuffers();
                        }

                        function record(inputBuffer) {
                            console.log("record  "   );
                            for (var channel = 0; channel < numChannels; channel++) {
                                recBuffers[channel].push(inputBuffer[channel]);
                            }
                            recLength += inputBuffer[0].length;
                        }

                        function exportWAV(type) {
                            console.log("exportWAV  "   );
                            var buffers = [];
                            for (var channel = 0; channel < numChannels; channel++) {
                                buffers.push(mergeBuffers(recBuffers[channel], recLength));
                            }
                            var interleaved = undefined;
                            if (numChannels === 2) {
                                interleaved = interleave(buffers[0], buffers[1]);
                            } else {
                                interleaved = buffers[0];
                            }
                            console.log("exportWAV  length: " ,interleaved.length  );
                            var dataview = encodeWAV(interleaved);
                            var audioBlob = new Blob([dataview], {type: type});

                            self.postMessage({command: 'exportWAV', data: audioBlob});
                        }

                        function getBuffer() {
                            var buffers = [];
                            for (var channel = 0; channel < numChannels; channel++) {
                                buffers.push(mergeBuffers(recBuffers[channel], recLength));
                            }
                            self.postMessage({command: 'getBuffer', data: buffers});
                        }

                        function clear() {
                            recLength = 0;
                            recBuffers = [];
                            initBuffers();
                        }

                        function initBuffers() {
                            for (var channel = 0; channel < numChannels; channel++) {
                                recBuffers[channel] = [];
                            }
                        }

                        function mergeBuffers(recBuffers, recLength) {
                            var result = new Float32Array(recLength);
                            var offset = 0;
                            for (var i = 0; i < recBuffers.length; i++) {
                                result.set(recBuffers[i], offset);
                                offset += recBuffers[i].length;
                            }
                            return result;
                        }

                        function interleave(inputL, inputR) {
                            var length = inputL.length + inputR.length;
                            var result = new Float32Array(length);

                            var index = 0,
                                inputIndex = 0;

                            while (index < length) {
                                result[index++] = inputL[inputIndex];
                                result[index++] = inputR[inputIndex];
                                inputIndex++;
                            }
                            return result;
                        }
                        /*

                        var  littleEndian = true;
  
                         function floatTo16BitPCM(output, offset, input, littleEndian) {
                         for (var i = 0; i < input.length; i++, offset += 2) {
                         var s = Math.max(-1, Math.min(1, input[i]));
                         output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, littleEndian);
                         }
                         }

                         function writeString(view, offset, string) {
                         for (var i = 0; i < string.length; i++) {
                         view.setUint8(offset + i, string.charCodeAt(i));
                         }
                         }

                         function encodeWAV(samples) {

                          var  littleEndian = true;

                         var buffer = new ArrayBuffer(44 + samples.length * 2);
                         var view = new DataView(buffer);

                         // RIFF identifier
                         writeString(view, 0, 'RIFF');
                         //RIFF chunk length;
                         view.setUint32(4, 36 + samples.length * 2, littleEndian);
                         // RIFF type
                         writeString(view, 8, 'WAVE');
                         //format chunk identifier
                         writeString(view, 12, 'fmt ');
                         //format chunk length /
                         view.setUint32(16, 16, littleEndian);
                         // sample format (raw)
                         view.setUint16(20, 1, littleEndian);
                         // channel count
                         view.setUint16(22, numChannels, littleEndian);
                         /// sample rate /
                         view.setUint32(24, sampleRate, littleEndian);
                         // byte rate (sample rate * block align)
                         view.setUint32(28, sampleRate * 4, littleEndian);
                         // block align (channel count * bytes per sample)
                         view.setUint16(32, numChannels * 2, littleEndian);
                         // bits per sample
                         view.setUint16(34, 16, littleEndian);
                         // data chunk identifier
                         writeString(view, 36, 'data');
                         // data chunk length
                         view.setUint32(40, samples.length * 2, littleEndian);

                         floatTo16BitPCM(view, 44, samples, littleEndian);

                         return view;
                         }
                         */



                   function floatTo16BitPCM(output, offset, input) {
                        for (var i = 0; i < input.length;   ) {
                            var s = Math.max(-1, Math.min(1, input[i]));

                            if ( i % 8 == 0 ){
                                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                                offset += 2
                            }
                            i++

                        }
                    }
                        function floatTo8BitPCM(output, offset, input) {
                            for (var i = 0; i < input.length;   ) {
                                var s = Math.max(-1, Math.min(1, input[i]));

                                if ( i % 4 === 0 ){
                                    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
                                    s = s >>8;
                                    s = s +128;
                                    output.setUint8(offset,  s * 0xFF, true);
                                    offset += 1
                                }
                                i++

                            }
                        }


                    function writeString(view, offset, string) {
                        for (var i = 0; i < string.length; i++) {
                            view.setUint8(offset + i, string.charCodeAt(i));
                        }
                    }

                    function encodeWAV(samples) {

                        console.log("encodeWav: ", samples.length);

                        // 原来是 * 2 应该是 单pcm 转 双声道
                        //  目前转 1 声道
                        //  8 bit
                        // s 所以 先 *2 在 转 8 bit  那么 /2
                        // 最后取样率 /4
                        var data_length = samples.length*2/2/4;
                        var outputnumChannels = 2;
                        var sampleBites = 8;
                        var outputsampleRate = sampleRate/4;
                        var blocklength = 8;

                        var buffer = new ArrayBuffer(44 + data_length);
                        var view = new DataView(buffer);

                        //RIFF identifier /
                        writeString(view, 0, 'RIFF');
                        // RIFF chunk length /
                        view.setUint32(4, 36 + data_length, true);
                        // RIFF type /
                        writeString(view, 8, 'WAVE');
                        // format chunk identifier /
                        writeString(view, 12, 'fmt ');
                        // format chunk length /
                        view.setUint32(16, 16, true);
                        // sample format (raw) /
                        view.setUint16(20, 1, true);
                        //channel count //
                        view.setUint16(22, outputnumChannels, true);
                        // sample rate /
                        view.setUint32(24, outputsampleRate, true);
                        // byte rate (sample rate * block align) /
                        view.setUint32(28, outputsampleRate * sampleBites  * outputnumChannels/ 8, true);
                        // block align (channel count * bytes per sample) /
                        view.setUint16(32, outputnumChannels *  sampleBites/ 8, true);
                        // bits per sample /
                        view.setUint16(34, sampleBites, true);
                        // data chunk identifier /
                        writeString(view, 36, 'data');
                        // data chunk length /
                        view.setUint32(40, data_length, true);

                        floatTo8BitPCM(view, 44, samples);

                        return view;
                    }


















                          
                    }, self);



























                    this.worker.postMessage({
                        command: 'init',
                        config: {
                            sampleRate: this.context.sampleRate,
                            numChannels: this.config.numChannels
                        }
                    });

                    this.worker.onmessage = function (e) {
                        var cb = _this.callbacks[e.data.command].pop();
                        if (typeof cb == 'function') {
                            cb(e.data.data);
                        }
                    };
                }

                _createClass(Recorder, [{
                    key: 'record',
                    value: function record() {
                        this.recording = true;
                    }
                }, {
                    key: 'stop',
                    value: function stop() {
                        this.recording = false;
                    }
                }, {
                    key: 'clear',
                    value: function clear() {
                        this.worker.postMessage({command: 'clear'});
                    }
                }, {
                    key: 'getBuffer',
                    value: function getBuffer(cb) {
                        cb = cb || this.config.callback;
                        if (!cb) throw new Error('Callback not set');

                        this.callbacks.getBuffer.push(cb);

                        this.worker.postMessage({command: 'getBuffer'});
                    }
                }, {
                    key: 'exportWAV',
                    value: function exportWAV(cb, mimeType) {
                        mimeType = mimeType || this.config.mimeType;
                        cb = cb || this.config.callback;
                        if (!cb) throw new Error('Callback not set');

                        this.callbacks.exportWAV.push(cb);

                        this.worker.postMessage({
                            command: 'exportWAV',
                            type: mimeType
                        });
                    }
                }], [{
                    key: 'forceDownload',
                    value: function forceDownload(blob, filename) {
                        var url = (window.URL || window.webkitURL).createObjectURL(blob);
                        var link = window.document.createElement('a');
                        link.href = url;
                        link.download = filename || 'output.wav';
                        var click = document.createEvent("Event");
                        click.initEvent("click", true, true);
                        link.dispatchEvent(click);
                    }
                }]);

                return Recorder;
            })();

            exports.default = Recorder;

        }, {"inline-worker": 3}], 3: [function (require, module, exports) {
            "use strict";

            module.exports = require("./inline-worker");
        }, {"./inline-worker": 4}], 4: [function (require, module, exports) {
            (function (global) {
                "use strict";

                var _createClass = (function () {
                    function defineProperties(target, props) {
                        for (var key in props) {
                            var prop = props[key];
                            prop.configurable = true;
                            if (prop.value) prop.writable = true;
                        }
                        Object.defineProperties(target, props);
                    }

                    return function (Constructor, protoProps, staticProps) {
                        if (protoProps) defineProperties(Constructor.prototype, protoProps);
                        if (staticProps) defineProperties(Constructor, staticProps);
                        return Constructor;
                    };
                })();

                var _classCallCheck = function (instance, Constructor) {
                    if (!(instance instanceof Constructor)) {
                        throw new TypeError("Cannot call a class as a function");
                    }
                };

                var WORKER_ENABLED = !!(global === global.window && global.URL && global.Blob && global.Worker);

                var InlineWorker = (function () {
                    function InlineWorker(func, self) {
                        var _this = this;

                        _classCallCheck(this, InlineWorker);

                        if (WORKER_ENABLED) {
                            var functionBody = func.toString().trim().match(/^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/)[1];
                            var url = global.URL.createObjectURL(new global.Blob([functionBody], {type: "text/javascript"}));

                            return new global.Worker(url);
                        }

                        this.self = self;
                        this.self.postMessage = function (data) {
                            setTimeout(function () {
                                _this.onmessage({data: data});
                            }, 0);
                        };

                        setTimeout(function () {
                            func.call(self);
                        }, 0);
                    }

                    _createClass(InlineWorker, {
                        postMessage: {
                            value: function postMessage(data) {
                                var _this = this;

                                setTimeout(function () {
                                    _this.self.onmessage({data: data});
                                }, 0);
                            }
                        }
                    });

                    return InlineWorker;
                })();

                module.exports = InlineWorker;
            }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
        }, {}]
    }, {}, [1])(1)
});