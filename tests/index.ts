import {expect} from "chai";
import MockConsole from "../src/";

describe("Mock Console", function() {
  describe("Expectations", function() {
    let mockConsole = new MockConsole();

    afterEach("cleanup", () => {
      mockConsole.revert(true);
    });

    it("Throws when it expects one message but it had received another", function() {
      mockConsole.wrapConsole();

      expect(() => {
        console.log("one");
        mockConsole.expectLog("another");
      }).to.throw(`Log error, expected message:
> {"type":"log","arguments":["another"]}
But had received message:
> {"type":"log","arguments":["one"]}`);
    });

    it("Throws when it receives one message but it had expected another", function() {
      mockConsole.wrapConsole();

      expect(() => {
        mockConsole.expectLog("another");
        console.log("one");
      }).to.throw(`Log error, expected message:
> {"type":"log","arguments":["another"]}
But received message:
> {"type":"log","arguments":["one"]}`);
    });

    it("Throws when it receives messages but did not expect them", function() {
      mockConsole.wrapConsole();

      expect(() => {
        console.log("one", "two");
        console.warn("two", "three");
        console.error("three", "four");

        mockConsole.revert();
      }).to.throw(`Messages received but not expected:
0: {"type":"log","arguments":["one","two"]}
1: {"type":"warn","arguments":["two","three"]}
2: {"type":"error","arguments":["three","four"]}
`);
    });

    it("Throws when it expects messages but did not receive them", function() {
      mockConsole.wrapConsole();

      expect(() => {
        mockConsole.expectLog("one", "two");
        mockConsole.expectWarn("two", "three");
        mockConsole.expectError("three", "four");

        mockConsole.revert();
      }).to.throw(`Messages expected but not received:
0: {"type":"log","arguments":["one","two"]}
1: {"type":"warn","arguments":["two","three"]}
2: {"type":"error","arguments":["three","four"]}
`);
    });

    it("Throws when it expects one kind of message but received another", function() {
      mockConsole.wrapConsole();

      expect(() => {
        mockConsole.expectLog("one", "two");
        console.warn("one", "two");
      }).to.throw(`Log error, expected message:
> {"type":"log","arguments":["one","two"]}
But received message:
> {"type":"warn","arguments":["one","two"]}`);
    });

    it("Throws when it received one kind of message but expected another", function() {
      mockConsole.wrapConsole();

      expect(() => {
        console.warn("one", "two");
        mockConsole.expectLog("one", "two");
      }).to.throw(`Log error, expected message:
> {"type":"log","arguments":["one","two"]}
But had received message:
> {"type":"warn","arguments":["one","two"]}`);
    });
  });

  describe("events", () => {
    let mockConsole = new MockConsole();

    afterEach("cleanup", () => {
      mockConsole.revert(true);
    });

    it("Emits an empty event when the expected messages have been received", () => {
      let called = false;

      mockConsole.wrapConsole();

      mockConsole.onceEmpty(() => {
        called = true;
      });

      expect(called, "Callback should have been called on an empty console").to.be.true;
    });

    it("Does not emit an empty event when there are messages to be expected", () => {
      let called = false;

      mockConsole.wrapConsole();

      console.log("!");

      mockConsole.onceEmpty(() => {
        called = true;
      });

      expect(called, "Callback should not have been called").to.be.false;

      mockConsole.expectLog("!");
    });

    it("Does not emit an empty event when there are messages to be received", () => {
      let called = false;

      mockConsole.wrapConsole();

      mockConsole.expectLog("!");

      mockConsole.onceEmpty(() => {
        called = true;
      });

      expect(called, "Callback should not have been called").to.be.false;
    });

    it("Does emit an empty event when the received messages have been expected", () => {
      let called = false;

      mockConsole.wrapConsole();

      console.log("!");

      mockConsole.onceEmpty(() => {
        called = true;
      });

      expect(called, "Callback should not have been called").to.be.false;

      mockConsole.expectLog("!");

      expect(called, "Callback should have been called").to.be.true;
    });

    // TODO go through the expectations and fill them in

    it("Does emit an empty event when the expected messages have been received", () => {
      let called = false;

      mockConsole.wrapConsole();

      mockConsole.expectLog("a");
      mockConsole.expectLog("b");
      mockConsole.expectWarn("c");

      mockConsole.onceEmpty(() => {
        called = true;
      });

      console.log("a");
      console.log("b");

      expect(called, "Callback should not have been called before all messages are received").to.be.false;

      console.warn("c");

      expect(called, "Callback should have been called").to.be.true;
    });
  });
});
