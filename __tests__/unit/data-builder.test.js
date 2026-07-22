import { AgentTestDataBuilder } from '../../databuilders/agent-test-data-builder.js';
import { BaseDataBuilder, baseDataBuilder } from '../../databuilders/base-data-builder.js';

describe('BaseDataBuilder', () => {
  test('has default version "1"', () => {
    expect(baseDataBuilder.getVersion()).toBe('1');
  });

  test('has name "BaseDataBuilder"', () => {
    expect(baseDataBuilder.name).toBe('BaseDataBuilder');
  });

  test('genImp throws when called on base class', () => {
    expect(() => baseDataBuilder.genImp()).toThrow('genImp() must be implemented');
  });

  test('can be instantiated via class', () => {
    const builder = new BaseDataBuilder();
    expect(builder.version).toBe('1');
    expect(builder.name).toBe('BaseDataBuilder');
  });
});

describe('AgentTestDataBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = AgentTestDataBuilder();
  });

  test('is an instance of BaseDataBuilder', () => {
    expect(builder instanceof BaseDataBuilder).toBe(true);
  });

  test('has name "AgentTestDataBuilder"', () => {
    expect(builder.name).toBe('AgentTestDataBuilder');
  });

  test('has version "1"', () => {
    expect(builder.getVersion()).toBe('1');
  });

  test('genImp populates userEmail', () => {
    expect(builder.userEmail).toBe('agent@anilathomes.com');
  });

  test('genImp populates userPassword', () => {
    expect(builder.userPassword).toBe('Password.123$');
  });

  test('genImp does not throw (overrides base)', () => {
    expect(() => builder.genImp()).not.toThrow();
  });

  test('genImp returns the builder instance', () => {
    const result = builder.genImp();
    expect(result).toBe(builder);
  });

  test('each call to AgentTestDataBuilder() creates a new instance', () => {
    const a = AgentTestDataBuilder();
    const b = AgentTestDataBuilder();
    expect(a).not.toBe(b);
  });
});
