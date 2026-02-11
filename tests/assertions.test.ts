import { describe, it, expect } from 'vitest';
import { evaluateAssertion } from '../src/executor.js';
import type { AssertionDefinition } from '../src/types.js';

function assert(operator: AssertionDefinition['operator'], actual: unknown, value?: unknown) {
  return evaluateAssertion({ path: 'test', operator, value }, actual);
}

describe('evaluateAssertion', () => {
  describe('equals', () => {
    it('passes when values match (number)', () => {
      expect(assert('equals', 200, 200).success).toBe(true);
    });

    it('passes when values match (string)', () => {
      expect(assert('equals', 'hello', 'hello').success).toBe(true);
    });

    it('fails when values differ', () => {
      const r = assert('equals', 404, 200);
      expect(r.success).toBe(false);
      expect(r.message).toContain('200');
      expect(r.message).toContain('404');
    });

    it('passes with deep equality (object)', () => {
      expect(assert('equals', { a: 1 }, { a: 1 }).success).toBe(true);
    });

    it('fails with deep inequality', () => {
      expect(assert('equals', { a: 1 }, { a: 2 }).success).toBe(false);
    });
  });

  describe('notEquals', () => {
    it('passes when values differ', () => {
      expect(assert('notEquals', 'a', 'b').success).toBe(true);
    });

    it('fails when values match', () => {
      expect(assert('notEquals', 42, 42).success).toBe(false);
    });
  });

  describe('contains', () => {
    it('passes when string contains substring', () => {
      expect(assert('contains', 'hello world', 'world').success).toBe(true);
    });

    it('fails when string does not contain substring', () => {
      expect(assert('contains', 'hello', 'world').success).toBe(false);
    });

    it('passes when array contains value', () => {
      expect(assert('contains', ['a', 'b', 'c'], 'b').success).toBe(true);
    });

    it('fails when array does not contain value', () => {
      expect(assert('contains', ['a', 'b'], 'z').success).toBe(false);
    });
  });

  describe('notContains', () => {
    it('passes when string does not contain substring', () => {
      expect(assert('notContains', 'hello', 'world').success).toBe(true);
    });

    it('fails when string contains substring', () => {
      expect(assert('notContains', 'hello world', 'world').success).toBe(false);
    });

    it('passes for non-string/array values', () => {
      expect(assert('notContains', 42, 'x').success).toBe(true);
    });
  });

  describe('exists', () => {
    it('passes when value is defined', () => {
      expect(assert('exists', 'something').success).toBe(true);
    });

    it('passes when value is 0', () => {
      expect(assert('exists', 0).success).toBe(true);
    });

    it('passes when value is empty string', () => {
      expect(assert('exists', '').success).toBe(true);
    });

    it('fails when value is null', () => {
      expect(assert('exists', null).success).toBe(false);
    });

    it('fails when value is undefined', () => {
      expect(assert('exists', undefined).success).toBe(false);
    });
  });

  describe('notExists', () => {
    it('passes when null', () => {
      expect(assert('notExists', null).success).toBe(true);
    });

    it('passes when undefined', () => {
      expect(assert('notExists', undefined).success).toBe(true);
    });

    it('fails when value exists', () => {
      expect(assert('notExists', 'val').success).toBe(false);
    });
  });

  describe('greaterThan', () => {
    it('passes when actual > expected', () => {
      expect(assert('greaterThan', 10, 5).success).toBe(true);
    });

    it('fails when actual <= expected', () => {
      expect(assert('greaterThan', 5, 5).success).toBe(false);
      expect(assert('greaterThan', 3, 5).success).toBe(false);
    });

    it('fails for non-numeric values', () => {
      expect(assert('greaterThan', 'ten', 5).success).toBe(false);
    });
  });

  describe('lessThan', () => {
    it('passes when actual < expected', () => {
      expect(assert('lessThan', 3, 10).success).toBe(true);
    });

    it('fails when actual >= expected', () => {
      expect(assert('lessThan', 10, 10).success).toBe(false);
    });
  });

  describe('matches', () => {
    it('passes when regex matches', () => {
      expect(assert('matches', 'abc-123', '^[a-z]+-\\d+$').success).toBe(true);
    });

    it('fails when regex does not match', () => {
      expect(assert('matches', 'ABC', '^[a-z]+$').success).toBe(false);
    });

    it('fails for non-string actual', () => {
      expect(assert('matches', 123, '\\d+').success).toBe(false);
    });
  });

  describe('custom message', () => {
    it('uses custom message when provided', () => {
      const r = evaluateAssertion(
        { path: 'status', operator: 'equals', value: 200, message: 'Expected OK' },
        500,
      );
      expect(r.success).toBe(false);
      expect(r.message).toBe('Expected OK');
    });
  });
});
