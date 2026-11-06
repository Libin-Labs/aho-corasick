# @lp-labs/aho-corasick

True failure-link Aho-Corasick UTF-16 multi-pattern matching with bounded overlapping outputs.

Standalone original implementation; zero runtime, peer, or sibling-package dependencies. Node.js 18+, ESM and CommonJS with separate declaration trees. No browser globals are accessed at import time; compiled runtime uses only standard JavaScript APIs.

## Install

```sh
npm install @lp-labs/aho-corasick
```

## Quick start

```js
import { createAhoCorasick } from '@lp-labs/aho-corasick';
const search = createAhoCorasick(['he', 'she', 'hers']);
console.log(search.search('ushers'));
```

CommonJS exposes the same named exports:

```cjs
const api = require('@lp-labs/aho-corasick');
```

## Customization

```js
import { createAhoCorasick } from '@lp-labs/aho-corasick';
const search = createAhoCorasick(['a', 'aa'], { maxPatternUnits: 20, maxPatterns: 5 });
console.log(
  search.patternCount,
  search.stateCount,
  search.search('aaa', { maxInput: 100, maxMatches: 5 }),
);
```

## Semantics, limits and errors

`createAhoCorasick(patterns, options)` copies a nonempty dense string array and constructs a trie, breadth-first failure links, and dictionary output links. Inherited output lists are not duplicated. Empty patterns are rejected (TypeError), rather than implicitly matching every boundary. Duplicate patterns are supported and retain their distinct original `patternIndex`. Defaults: `maxPatterns=10000`, `maxPatternUnits=100000` total UTF-16 units; budgets must be positive safe integers. `patternCount` and `stateCount` are readonly counts, with the root included.

`search(text, {maxInput, maxMatches})` defaults to 1,000,000 input units and 100,000 matches. It returns fresh objects with original pattern index and half-open UTF-16 `start/end`. Overlaps are included; order is increasing end offset, current state's own pattern insertion order, then successive suffix outputs. Literal, case-sensitive **UTF-16 code-unit semantics** intentionally allow lone-surrogate patterns and NUL/control text. No normalization, grapheme or Unicode case equivalence is implied. Empty text returns [].

Malformed/sparse patterns, oversized input and too many patterns throw TypeError; invalid numeric budgets, total pattern-unit overflow and output overflow throw RangeError. The match that would exceed the limit throws; no partial or silently truncated result is returned. Compiled structure is private, repeated searches are independent, and result mutation cannot alter it.

Trie storage is O(total pattern units + pattern count). Failure construction using sparse Map edges may walk failure chains, worst-case O(total units × longest pattern); search is amortized O(text units + emitted matches) with expected constant Map lookup costs. Result storage is O(matches), bounded explicitly.

## Complete public declaration API

The following is the complete public ESM declaration surface; CommonJS has matching declarations and runtime exports. Optional properties are omitted rather than supplied as undefined under exactOptionalPropertyTypes.

```ts
export interface AutomatonOptions {
  maxPatternUnits?: number;
  maxPatterns?: number;
}
export interface SearchOptions {
  maxInput?: number;
  maxMatches?: number;
}
export interface PatternMatch {
  patternIndex: number;
  start: number;
  end: number;
}
export interface AhoCorasick {
  readonly patternCount: number;
  readonly stateCount: number;
  search(text: string, options?: SearchOptions): PatternMatch[];
}
/** Literal, case-sensitive UTF-16 matching, including overlapping and duplicate patterns. */
export declare function createAhoCorasick(
  patterns: readonly string[],
  options?: AutomatonOptions,
): AhoCorasick;
```

## Development and verification

```sh
npm ci --offline --ignore-scripts --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

The offline command requires the dev tools already present in npm's cache. TypeScript ^5.9.3 and Prettier ^3.6.2 are dev-only. Build targets ES2022 with strict NodeNext declarations, noUncheckedIndexedAccess, exactOptionalPropertyTypes, noUnused checks, ES2022/DOM libs and no ambient type packages. Runtime tests import the ESM distribution directly and check CommonJS parity. Bare-package .mts/.cts consumer tests include negative type assertions. Published files are only dist, this README, LICENSE and package.json. No publication is performed by tests.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
