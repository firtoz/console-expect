"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var events_1 = require("events");
var util = require("util");
var MockConsole = /** @class */ (function () {
    function MockConsole() {
        for (var _i = 0, _a = MockConsole.messageTypes; _i < _a.length; _i++) {
            var messageType = _a[_i];
            this[messageType] = this.wrapLog(messageType);
        }
    }
    MockConsole.prototype.wrapLog = function (functionName) {
        var _this = this;
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (_this.verbose) {
                (_a = _this.mockedConsole)[functionName].apply(_a, args);
            }
            var error = new Error();
            var lines = error.stack.split("\n");
            // delete lines up to the original caller
            lines.splice(0, 2);
            var stack = lines.join("\n");
            _this.messageReceived({
                args: args,
                type: functionName,
                stack: stack,
            });
            var _a;
        };
    };
    MockConsole.prototype.revert = function (ignoreChecks) {
        var _this = this;
        if (ignoreChecks === void 0) { ignoreChecks = false; }
        if (global.console !== this) {
            return;
        }
        Object.defineProperty(global, "console", {
            value: this.mockedConsole,
        });
        this.verbose = false;
        this.events.removeAllListeners();
        if (ignoreChecks) {
            // print all messages out
            this.receivedMessages.forEach(function (messageInfo) {
                var func = global.console[messageInfo.type];
                // delete message.args.type;
                func.apply(global.console, messageInfo.args);
            });
            // clean history
            this.receivedMessages.splice(0);
            this.expectedMessages.splice(0);
            return;
        }
        var _a = this, receivedMessages = _a.receivedMessages, expectedMessages = _a.expectedMessages;
        var error = new Error();
        var lines = error.stack.split("\n");
        // delete lines up to the original caller
        lines.splice(0, 2);
        var stack = lines.join("\n");
        if (receivedMessages.length > 0) {
            assert(false, "Messages received but not expected:\n" + receivedMessages.map(function (messageInfo, i) { return i + ": " + _this.printArgs(messageInfo); }).join('\n') + "\n" + stack);
        }
        else if (expectedMessages.length > 0) {
            assert(false, "Messages expected but not received:\n" + expectedMessages.map(function (args, i) { return i + ": " + _this.printArgs(args); }).join('\n') + "\n" + stack);
        }
    };
    MockConsole.prototype.printArgs = function (messageInfo) {
        return JSON.stringify({
            type: messageInfo.type,
            arguments: messageInfo.args.map(function (arg) {
                return typeof arg === "string" ? arg :
                    util.inspect(arg, {});
            })
        });
    };
    MockConsole.prototype.onceEmpty = function (callback) {
        if (this.receivedMessages.length === 0 && this.expectedMessages.length === 0) {
            callback();
        }
        else {
            this.events.once("empty", callback);
        }
    };
    MockConsole.prototype.expectLog = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.expect("log", args);
    };
    MockConsole.prototype.expectWarn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.expect("warn", args);
    };
    MockConsole.prototype.expectError = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.expect("error", args);
    };
    MockConsole.prototype.expect = function (type, args) {
        var _a = this, receivedMessages = _a.receivedMessages, expectedMessages = _a.expectedMessages;
        var error = new Error();
        var lines = error.stack.split("\n");
        // delete lines up to the original caller
        lines.splice(0, 3);
        var expectedMessage = {
            args: args,
            type: type,
            stack: lines.join("\n"),
        };
        if (receivedMessages.length > 0) {
            this.checkMessage(expectedMessage, receivedMessages.shift(), true);
            if (this.receivedMessages.length === 0) {
                this.events.emit("empty");
            }
        }
        else {
            expectedMessages.push(expectedMessage);
        }
    };
    MockConsole.prototype.messageReceived = function (messageInfo) {
        var _a = this, receivedMessages = _a.receivedMessages, expectedMessages = _a.expectedMessages;
        // const args = messageInfo.args;
        if (expectedMessages.length > 0) {
            this.checkMessage(expectedMessages.shift(), messageInfo, false);
            if (expectedMessages.length === 0) {
                this.events.emit('empty');
            }
        }
        else {
            receivedMessages.push(messageInfo);
        }
    };
    MockConsole.prototype.checkMessage = function (expected, actual, justReceived) {
        var expectedMessage = this.printArgs(expected);
        var actualMessage = this.printArgs(actual);
        if (actualMessage !== expectedMessage) {
            // reset state to reduce additional errors
            this.receivedMessages.length = 0;
            this.expectedMessages.length = 0;
            var actualStack = actual.stack;
            // find common stack frames and hide them from expected
            var seenLines_1 = actualStack.split("\n").reduce(function (map, line) {
                map[line] = true;
                return map;
            }, {});
            var linesRemoved_1 = false;
            var expectedStack = expected.stack
                .split("\n")
                .filter(function (line) {
                if (seenLines_1[line] === true) {
                    linesRemoved_1 = true;
                }
                return seenLines_1[line] !== true;
            })
                .join("\n");
            if (linesRemoved_1) {
                expectedStack += "\n    (...common frames removed)";
            }
            var err = void 0;
            if (justReceived) {
                err = new Error("Log error, expected message:\n> " + expectedMessage + "\nBut had received message:\n> " + actualMessage);
            }
            else {
                err = new Error("Log error, expected message:\n> " + expectedMessage + "\nBut received message:\n> " + actualMessage);
            }
            err.stack = "Expected:\n" + expectedStack + "\nReceived:\n" + actualStack;
            throw err;
        }
    };
    MockConsole.prototype.wrapConsole = function () {
        this.receivedMessages = [];
        this.expectedMessages = [];
        this.mockedConsole = global.console;
        this.events = new events_1.EventEmitter();
        this.verbose = false;
        Object.defineProperty(global, "console", {
            value: this,
        });
    };
    MockConsole.messageTypes = [
        "log",
        "trace",
        "warn",
        "error",
        "info",
        "exception",
        "dirxml",
        "dir",
        "debug",
        "assert",
    ];
    return MockConsole;
}());
exports.default = MockConsole;
//# sourceMappingURL=index.js.map