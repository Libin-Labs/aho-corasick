import {
  createAhoCorasick,
  type AutomatonOptions,
  type SearchOptions,
  type PatternMatch,
  type AhoCorasick,
} from '@lp-labs/aho-corasick';
const options: AutomatonOptions = { maxPatterns: 10 };
const search: AhoCorasick = createAhoCorasick(['he', 'she'], options);
const query: SearchOptions = { maxMatches: 20 };
const matches: PatternMatch[] = search.search('she', query);
// @ts-expect-error patterns must be strings
createAhoCorasick([1]);
// @ts-expect-error query limit must be numeric
search.search('a', { maxMatches: '1' });
void matches;
