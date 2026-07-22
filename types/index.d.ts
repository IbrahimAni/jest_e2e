export interface DeviceOptions {
  waitTimeout?: number;
  timeout?: number;
}

export interface AuthCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  url?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  [key: string]: unknown;
}

export interface AuthConfig {
  provider?: 'vercel' | 'generic' | string;
  token?: string;
  key?: string;
  secret?: string;
  headerName?: string;
  headerValue?: string;
  headerPrefix?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string | number | boolean | Array<string | number | boolean>>;
  cookies?: AuthCookie | AuthCookie[];
  urlPatterns?: string | string[];
  urlPattern?: string;
  transport?: 'header' | 'headers' | 'query' | 'params' | 'both' | string;
  setBypassCookie?: boolean | 'true' | 'false' | 'samesitenone' | string;
}

export type AuthInput = AuthConfig | AuthConfig[] | 'vercel' | false;

export interface NavigationOptions {
  waitUntil?: string | string[];
  timeout?: number;
  auth?: AuthInput;
  [key: string]: unknown;
}

export interface DeviceAssertions {
  toContain(text: string): Promise<void>;
  toHaveText(text: string): Promise<void>;
  toBeVisible(): Promise<void>;
  toExist(): Promise<void>;
  toHaveValue(value: string): Promise<void>;
  toHaveAttribute(name: string, value: string): Promise<void>;
  toHaveClass(className: string): Promise<void>;
  toHaveCount(count: number): Promise<void>;
  not: DeviceAssertions;
}

export interface CSSDevice {
  click(selector: string, options?: object): Promise<void>;
  type(selector: string, text: string, options?: object): Promise<void>;
  waitFor(selector: string, options?: object): Promise<unknown>;
  get(selector: string): Promise<unknown>;
  getAll(selector: string): Promise<unknown[]>;
  getText(selector: string): Promise<string>;
  exists(selector: string): Promise<boolean>;
}

export interface Device {
  navigate(url: string, options?: NavigationOptions): Promise<unknown>;
  goBack(options?: object): Promise<unknown>;
  goForward(options?: object): Promise<unknown>;
  refresh(options?: object): Promise<unknown>;
  click(selector: string, options?: DeviceOptions): Promise<void>;
  type(selector: string, text: string, options?: object): Promise<void>;
  fill(selector: string, value: string | number, options?: DeviceOptions): Promise<void>;
  clear(selector: string, options?: DeviceOptions): Promise<void>;
  press(selector: string, key: string, options?: DeviceOptions): Promise<void>;
  select(selector: string, value: string | string[], options?: object): Promise<void>;
  hover(selector: string, options?: DeviceOptions): Promise<void>;
  waitFor(selector: string, options?: object): Promise<unknown>;
  waitForText(selector: string, text: string, options?: object): Promise<void>;
  waitForUrl(urlPattern: string, options?: object): Promise<void>;
  waitForNavigation(options?: object): Promise<unknown>;
  wait(ms: number): Promise<void>;
  get(selector: string, options?: DeviceOptions): Promise<unknown>;
  getAll(selector: string, options?: DeviceOptions): Promise<unknown[]>;
  getText(selector: string, options?: DeviceOptions): Promise<string>;
  getValue(selector: string, options?: DeviceOptions): Promise<string>;
  exists(selector: string): Promise<boolean>;
  isVisible(selector: string): Promise<boolean>;
  url(): string;
  title(): Promise<string>;
  content(): Promise<string>;
  evaluate(fn: Function): Promise<unknown>;
  screenshot(options?: object): Promise<Uint8Array>;
  expect(selector: string, options?: DeviceOptions): DeviceAssertions;
  css: CSSDevice;
}

export interface NetworkRule {
  pattern: string;
  action: 'block' | 'mock';
  response?: {
    status?: number;
    contentType?: string;
    body?: unknown;
    headers?: Record<string, string>;
  };
}

export interface ChromeDevice extends Device {
  enableDevTools(): Promise<void>;
  getPerformanceMetrics(): Promise<Record<string, unknown> | null>;
  interceptNetwork(rules: NetworkRule[] | string[]): Promise<void>;
  emulateDevice(device: unknown): Promise<void>;
  addCookie(cookie: object): Promise<void>;
  getCookies(): Promise<object[]>;
  clearCookies(): Promise<void>;
  waitForResponse(urlPattern: string, timeout?: number): Promise<unknown>;
  waitForRequest(urlPattern: string, timeout?: number): Promise<unknown>;
  debug(message: string): Promise<void>;
  log(level: string, message: string): Promise<void>;
  setMobileViewport(width?: number, height?: number): Promise<void>;
  simulateTouch(): Promise<void>;
  tap(selector: string): Promise<void>;
}

export interface E2ESetupConfig {
  databuilder?: Record<string, unknown> | null;
  devices?: Record<string, Device>;
  auth?: AuthInput;
  retries?: number;
  timeout?: number;
  screenshotOnFailure?: boolean;
  smoothMode?: boolean;
  actionDelay?: number;
  disableAnimations?: boolean;
}

export interface JestE2EConfig {
  auth?: AuthInput;
}

export interface E2EDebugInfo {
  config: E2ESetupConfig;
  environment: string;
  devices: string[];
  hasDataBuilder: boolean;
  initialized: boolean;
}

export interface E2ESetupResult {
  getTestData(): Record<string, unknown> | null;
  getDevices(): Record<string, Device>;
  addDevice(name: string, device: Device): E2ESetupResult;
  removeDevice(name: string): E2ESetupResult;
  getDevice(name: string): Device | undefined;
  setDataBuilder(builder: Record<string, unknown>): E2ESetupResult;
  updateConfig(config: Partial<E2ESetupConfig>): E2ESetupResult;
  setEnvironment(env: string): E2ESetupResult;
  getEnvironment(): string;
  debug(): E2EDebugInfo;
  reset(): E2ESetupResult;
  beforeEach(fn: (devices: Record<string, Device>, data: Record<string, unknown> | null) => void | Promise<void>): E2ESetupResult;
  afterEach(fn: (devices: Record<string, Device>, data: Record<string, unknown> | null) => void | Promise<void>): E2ESetupResult;
  beforeAll(fn: (devices: Record<string, Device>, data: Record<string, unknown> | null) => void | Promise<void>): E2ESetupResult;
  afterAll(fn: (devices: Record<string, Device>, data: Record<string, unknown> | null) => void | Promise<void>): E2ESetupResult;
  _config: unknown;
}

export interface BaseDataBuilderLike {
  version: string;
  name: string;
  getVersion(): string;
  genImp(): unknown;
}

export function E2ESetup(config?: E2ESetupConfig): E2ESetupResult;
export function createChromeE2EApi(options?: object): ChromeDevice;
export function defineConfig(config: JestE2EConfig): JestE2EConfig;
export function logStep(action: string, detail?: string): void;
export function AgentTestDataBuilder(): BaseDataBuilderLike & {
  userEmail: string;
  userPassword: string;
};
export const baseDataBuilder: BaseDataBuilderLike;
export const version: string;
