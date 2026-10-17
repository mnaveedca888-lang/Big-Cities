import { describe, expect, it } from 'vitest';
import { buildPagination } from './pagination';

describe('buildPagination', () => {
  it('creates a stable pagination payload from paging values', () => {
    expect(buildPagination(2, 10, 123)).toEqual({
      page: 2,
      perPage: 10,
      total: 123,
      totalPages: 13,
    });
  });

  it('clamps invalid values to safe defaults', () => {
    expect(buildPagination(0, 0, 5)).toEqual({
      page: 1,
      perPage: 20,
      total: 5,
      totalPages: 1,
    });
  });
});
