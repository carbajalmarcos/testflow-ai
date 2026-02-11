import { describe, it, expect } from 'vitest';
import { extractValue, interpolate } from '../src/executor.js';

describe('extractValue', () => {
  it('extracts a top-level value', () => {
    expect(extractValue({ status: 200 }, 'status')).toBe(200);
  });

  it('extracts a nested value', () => {
    expect(extractValue({ data: { user: { id: 'abc' } } }, 'data.user.id')).toBe('abc');
  });

  it('returns undefined for missing paths', () => {
    expect(extractValue({ a: 1 }, 'b.c')).toBeUndefined();
  });

  it('handles array access', () => {
    expect(extractValue({ items: ['a', 'b', 'c'] }, 'items[1]')).toBe('b');
  });

  it('handles nested array access', () => {
    const obj = { data: { users: [{ id: 1 }, { id: 2 }] } };
    expect(extractValue(obj, 'data.users[0].id')).toBe(1);
    expect(extractValue(obj, 'data.users[1].id')).toBe(2);
  });

  it('returns undefined for out-of-bounds array access', () => {
    expect(extractValue({ items: [1] }, 'items[5]')).toBeUndefined();
  });

  it('returns undefined when accessing array on non-array', () => {
    expect(extractValue({ items: 'not an array' }, 'items[0]')).toBeUndefined();
  });

  it('handles null in path', () => {
    expect(extractValue({ a: null }, 'a.b')).toBeUndefined();
  });

  it('handles undefined input', () => {
    expect(extractValue(undefined, 'a')).toBeUndefined();
  });
});

describe('interpolate', () => {
  it('replaces simple variables', () => {
    expect(interpolate('Hello ${name}', { name: 'World' })).toBe('Hello World');
  });

  it('replaces multiple variables', () => {
    const result = interpolate('${method} /users/${id}', { method: 'GET', id: '42' });
    expect(result).toBe('GET /users/42');
  });

  it('preserves unreplaced variables', () => {
    expect(interpolate('${missing}', {})).toBe('${missing}');
  });

  it('handles numeric values', () => {
    expect(interpolate('port: ${port}', { port: 3000 })).toBe('port: 3000');
  });

  it('serializes objects as JSON', () => {
    const result = interpolate('data: ${obj}', { obj: { key: 'val' } });
    expect(result).toBe('data: {"key":"val"}');
  });

  it('handles nested path variables', () => {
    const vars = { data: { user: { id: 'abc' } } };
    expect(interpolate('user: ${data.user.id}', vars)).toBe('user: abc');
  });

  it('handles array index in variables', () => {
    const vars = { items: [{ id: 'first' }, { id: 'second' }] };
    expect(interpolate('id: ${items[0].id}', vars)).toBe('id: first');
  });

  it('returns empty string for null/undefined input', () => {
    expect(interpolate(null as unknown as string, {})).toBe('');
    expect(interpolate(undefined as unknown as string, {})).toBe('');
  });
});
