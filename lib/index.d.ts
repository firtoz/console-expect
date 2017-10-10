export default class MockConsole {
    private mockedConsole?;
    private receivedMessages;
    private expectedMessages;
    private events;
    private wrapLog(functionName);
    revert(ignoreChecks?: boolean): void;
    private printArgs(messageInfo);
    onceEmpty(callback: () => void): void;
    expectLog(...args: any[]): void;
    expectWarn(...args: any[]): void;
    expectError(...args: any[]): void;
    private expect(type, args);
    private messageReceived(messageInfo);
    private checkMessage(expected, actual, justReceived);
    static messageTypes: string[];
    constructor();
    private verbose;
    wrapConsole(): void;
}
