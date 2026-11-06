import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createAhoCorasick } from '../dist/esm/index.js';
const sorted = (matches) =>
  matches.sort((a, b) => a.end - b.end || a.patternIndex - b.patternIndex);
test('failure links suffix outputs duplicates and overlaps', () => {
  const search = createAhoCorasick(['he', 'she', 'hers', 'his', 'he']);
  assert.deepEqual(sorted(search.search('ushers')), [
    { patternIndex: 0, start: 2, end: 4 },
    { patternIndex: 1, start: 1, end: 4 },
    { patternIndex: 4, start: 2, end: 4 },
    { patternIndex: 2, start: 2, end: 6 },
  ]);
  assert.equal(createAhoCorasick(['a', 'aa', 'aaa']).search('aaaa').length, 9);
});
test('UTF16 indices and literal controls', () => {
  assert.deepEqual(createAhoCorasick(['😀', '\ude00', '\0']).search('😀\0'), [
    { patternIndex: 0, start: 0, end: 2 },
    { patternIndex: 1, start: 1, end: 2 },
    { patternIndex: 2, start: 2, end: 3 },
  ]);
});
test('empty sparse malformed and pattern budgets', () => {
  for (const patterns of [[], [''], [,], [1]])
    assert.throws(() => createAhoCorasick(patterns), TypeError);
  assert.throws(() => createAhoCorasick(['aa'], { maxPatternUnits: 1 }), RangeError);
  assert.throws(() => createAhoCorasick(['a', 'b'], { maxPatterns: 1 }), TypeError);
  assert.throws(() => createAhoCorasick(['x'], { maxPatterns: 0 }), RangeError);
});
test('result and input boundaries throw instead of truncating', () => {
  const search = createAhoCorasick(['a']);
  assert.equal(search.search('aa', { maxMatches: 2, maxInput: 2 }).length, 2);
  assert.throws(() => search.search('aa', { maxMatches: 1 }), RangeError);
  assert.throws(() => search.search('aa', { maxInput: 1 }), TypeError);
  assert.deepEqual(search.search(''), []);
});
test('input and results are independently owned', () => {
  const patterns = ['a', 'ab'];
  const search = createAhoCorasick(patterns);
  patterns[0] = 'z';
  const matches = search.search('ab');
  matches[0].start = 100;
  assert.equal(search.search('ab')[0].start, 0);
  assert.equal(search.patternCount, 2);
  assert.equal(search.stateCount, 3);
});
test('seeded independent naive multi-pattern oracle, 500 cases', () => {
  let seed = 360;
  const random = (n) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const word = (n) => Array.from({ length: n }, () => 'abc\0'[random(4)]).join('');
  for (let trial = 0; trial < 500; trial++) {
    const text = word(random(60)),
      patterns = Array.from({ length: 1 + random(8) }, () => word(1 + random(7)));
    const expected = [];
    patterns.forEach((pattern, patternIndex) => {
      for (let start = 0; start + pattern.length <= text.length; start++)
        if (text.slice(start, start + pattern.length) === pattern)
          expected.push({ patternIndex, start, end: start + pattern.length });
    });
    assert.deepEqual(sorted(createAhoCorasick(patterns).search(text)), sorted(expected));
  }
});
test('CJS surface', () => {
  assert.equal(
    createRequire(import.meta.url)('../dist/cjs/index.js')
      .createAhoCorasick(['a'])
      .search('a').length,
    1,
  );
});
