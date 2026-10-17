import { describe, expect, it } from 'vitest';
import { formatAreaValue, parseAreaInput } from './format';

describe('formatAreaValue', () => {
  it('adds sq km to unitless numeric values', () => {
    expect(formatAreaValue('881,913')).toBe('881,913 sq km');
    expect(formatAreaValue(123)).toBe('123 sq km');
  });

  it('preserves existing units and descriptive values', () => {
    expect(formatAreaValue('881,913 sq km')).toBe('881,913 sq km');
    expect(formatAreaValue('82 km²')).toBe('82 km²');
    expect(formatAreaValue('400 acres')).toBe('400 acres');
    expect(formatAreaValue('Varies by district')).toBe('Varies by district');
    expect(formatAreaValue('Municipal area varies by legal boundary; 2026 figures should use the official GIS.')).toBe('Municipal area varies by legal boundary; 2026 figures should use the official GIS.');
  });

  it('keeps empty values and arrays safe to display', () => {
    expect(formatAreaValue(null)).toBe('—');
    expect(formatAreaValue(['12', '30 km²'])).toBe('12 sq km, 30 km²');
  });
});

describe('parseAreaInput', () => {
  it('removes only the display-added unit while retaining the original value type', () => {
    expect(parseAreaInput('881,913 sq km', '881,913')).toBe('881,913');
    expect(parseAreaInput('123 sq km', 123)).toBe(123);
    expect(parseAreaInput('1,234 sq km', 1234)).toBe(1234);
  });

  it('preserves a unit that was already part of the original value', () => {
    expect(parseAreaInput('82 km²', '82 km²')).toBe('82 km²');
  });
});