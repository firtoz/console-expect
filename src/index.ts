import * as assert from 'assert';
import {EventEmitter} from "events";
import * as util from "util";

interface IMessageInfo {
  args: any[],
  type: string,
  stack: string,
}

export default class MockConsole {
  private mockedConsole?: Console;

  private receivedMessages: Array<IMessageInfo>;

  private expectedMessages: Array<IMessageInfo>;

  private events: EventEmitter;

  private wrapLog(functionName: string) {
    return (...args: any[]): void => {
      if (this.verbose) {
        (this.mockedConsole as any)[functionName](...args);
      }

      const error = new Error();

      const lines = error.stack.split("\n");

      // delete lines up to the original caller
      lines.splice(0, 2);

      const stack = lines.join("\n");

      this.messageReceived({
        args,
        type: functionName,
        stack,
      });
    }
  }

  public revert(ignoreChecks: boolean = false) {
    if ((global as any).console !== this) {
      return;
    }

    Object.defineProperty(global, "console", {
      value: this.mockedConsole,
    });

    this.verbose = false;
    this.events.removeAllListeners();

    if (ignoreChecks) {
      // print all messages out
      this.receivedMessages.forEach((messageInfo) => {
        const func: (...args: any[]) => void = (global.console as any)[messageInfo.type];

        // delete message.args.type;

        func.apply(global.console, messageInfo.args);
      });

      // clean history
      this.receivedMessages.splice(0);
      this.expectedMessages.splice(0);

      return;
    }

    const {
      receivedMessages,
      expectedMessages,
    } = this;

    const error = new Error();

    const lines = error.stack.split("\n");

    // delete lines up to the original caller
    lines.splice(0, 2);

    const stack = lines.join("\n");

    if (receivedMessages.length > 0) {
      assert(false, `Messages received but not expected:
${receivedMessages.map((messageInfo, i) => `${i}: ${this.printArgs(messageInfo)}`).join('\n')}
${stack}`);
    } else if (expectedMessages.length > 0) {
      assert(false, `Messages expected but not received:
${expectedMessages.map((args, i) => `${i}: ${this.printArgs(args)}`).join('\n')}
${stack}`);
    }
  }

  private printArgs(messageInfo: IMessageInfo) {
    return JSON.stringify({
      type: messageInfo.type,
      arguments: messageInfo.args.map(arg =>
        typeof arg === "string" ? arg :
          util.inspect(arg, {}))
    });
  }

  public onceEmpty(callback: () => void) {
    if (this.receivedMessages.length === 0 && this.expectedMessages.length === 0) {
      callback();
    } else {
      this.events.once("empty", callback);
    }
  }

  public expectLog(...args: any[]) {
    this.expect("log", args);
  }

  public expectWarn(...args: any[]) {
    this.expect("warn", args);
  }

  public expectError(...args: any[]) {
    this.expect("error", args);
  }

  private expect(type: string, args: any[]) {
    const {
      receivedMessages,
      expectedMessages,
    } = this;

    const error = new Error();

    const lines = error.stack.split("\n");

    // delete lines up to the original caller
    lines.splice(0, 3);

    const expectedMessage = {
      args,
      type,
      stack: lines.join("\n"),
    };

    if (receivedMessages.length > 0) {
      this.checkMessage(expectedMessage, receivedMessages.shift(), true);

      if (this.receivedMessages.length === 0) {
        this.events.emit("empty");
      }
    } else {
      expectedMessages.push(expectedMessage);
    }
  }

  private messageReceived(messageInfo: IMessageInfo) {
    const {
      receivedMessages,
      expectedMessages,
    } = this;

    // const args = messageInfo.args;

    if (expectedMessages.length > 0) {
      this.checkMessage(expectedMessages.shift(), messageInfo, false);

      if (expectedMessages.length === 0) {
        this.events.emit('empty');
      }
    } else {
      receivedMessages.push(messageInfo);
    }
  }

  private checkMessage(expected: IMessageInfo, actual: IMessageInfo, justReceived: boolean) {
    const expectedMessage = this.printArgs(expected);
    const actualMessage = this.printArgs(actual);

    if (actualMessage !== expectedMessage) {
      // reset state to reduce additional errors
      this.receivedMessages.length = 0;
      this.expectedMessages.length = 0;

      const actualStack = actual.stack;

      // find common stack frames and hide them from expected
      const seenLines = actualStack.split("\n").reduce((map: any, line) => {
        map[line] = true;
        return map;
      }, {});

      let linesRemoved = false;

      let expectedStack = expected.stack
        .split("\n")
        .filter(line => {
          if (seenLines[line] === true) {
            linesRemoved = true;
          }
          return seenLines[line] !== true
        })
        .join("\n");

      if (linesRemoved) {
        expectedStack += "\n    (...common frames removed)";
      }

      let err;

      if (justReceived) {
        err = new Error(`Log error, expected message:
> ${expectedMessage}
But had received message:
> ${actualMessage}`);
      } else {
        err = new Error(`Log error, expected message:
> ${expectedMessage}
But received message:
> ${actualMessage}`);
      }

      err.stack = `Expected:
${expectedStack}
Received:
${actualStack}`;

      throw err;

    }
  }

  static messageTypes = [
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

  constructor() {
    for (const messageType of MockConsole.messageTypes) {
      (this as any)[messageType] = this.wrapLog(messageType);
    }
  }

  private verbose: boolean;

  public wrapConsole() {
    this.receivedMessages = [];
    this.expectedMessages = [];
    this.mockedConsole = global.console;

    this.events = new EventEmitter();

    this.verbose = false;

    Object.defineProperty(global, "console", {
      value: this,
    });
  }
}
