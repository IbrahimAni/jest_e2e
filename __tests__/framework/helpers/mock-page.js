import { jest } from '@jest/globals';

// Shared mock for the global Puppeteer `page` object
export function createMockPage() {
  const mockElement = {
    isIntersectingViewport: jest.fn().mockResolvedValue(true),
    getAttribute: jest.fn(),
    textContent: 'mock text',
    value: 'mock value',
    className: 'mock-class',
  };

  return {
    goto: jest.fn().mockResolvedValue(null),
    click: jest.fn().mockResolvedValue(null),
    type: jest.fn().mockResolvedValue(null),
    select: jest.fn().mockResolvedValue([]),
    hover: jest.fn().mockResolvedValue(null),
    tap: jest.fn().mockResolvedValue(null),
    waitForSelector: jest.fn().mockResolvedValue(mockElement),
    waitForNavigation: jest.fn().mockResolvedValue(null),
    waitForFunction: jest.fn().mockResolvedValue(null),
    waitForResponse: jest.fn().mockResolvedValue(null),
    waitForRequest: jest.fn().mockResolvedValue(null),
    $: jest.fn().mockResolvedValue(mockElement),
    $$: jest.fn().mockResolvedValue([mockElement]),
    $eval: jest.fn().mockImplementation(() => Promise.resolve('mock text')),
    $$eval: jest.fn().mockResolvedValue([]),
    url: jest.fn().mockReturnValue('https://example.com'),
    title: jest.fn().mockResolvedValue('Mock Page'),
    content: jest.fn().mockResolvedValue('<html></html>'),
    evaluate: jest.fn().mockResolvedValue(null),
    screenshot: jest.fn().mockResolvedValue(Buffer.from('')),
    metrics: jest.fn().mockResolvedValue({}),
    setRequestInterception: jest.fn().mockResolvedValue(null),
    on: jest.fn(),
    setCookie: jest.fn().mockResolvedValue(null),
    cookies: jest.fn().mockResolvedValue([]),
    deleteCookie: jest.fn().mockResolvedValue(null),
    setViewport: jest.fn().mockResolvedValue(null),
    emulate: jest.fn().mockResolvedValue(null),
    target: jest.fn().mockReturnValue({
      createCDPSession: jest.fn().mockResolvedValue({
        send: jest.fn().mockResolvedValue(null),
      }),
    }),
  };
}
