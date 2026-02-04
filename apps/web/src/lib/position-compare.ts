/**
 * Compare two fractional index position strings for sorting.
 * Uses ASCII order comparison (required for fractional-indexing).
 * localeCompare uses locale rules which may sort "Zz" > "a0" incorrectly.
 */
export const comparePosition = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
