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
interface State {
  next: Map<string, number>;
  fail: number;
  outputLink: number;
  outputs: number[];
}
function budget(n: number): void {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError('Expected positive integer budget.');
}
/** Literal, case-sensitive UTF-16 matching, including overlapping and duplicate patterns. */
export function createAhoCorasick(
  patterns: readonly string[],
  options: AutomatonOptions = {},
): AhoCorasick {
  const { maxPatternUnits = 100_000, maxPatterns = 10_000 } = options;
  budget(maxPatternUnits);
  budget(maxPatterns);
  if (!Array.isArray(patterns) || !patterns.length || patterns.length > maxPatterns)
    throw new TypeError('Expected nonempty bounded pattern array.');
  const owned = Array.from(patterns);
  let total = 0;
  for (const pattern of owned) {
    if (typeof pattern !== 'string' || !pattern.length)
      throw new TypeError('Empty or nonstring pattern.');
    total += pattern.length;
    if (total > maxPatternUnits) throw new RangeError('Pattern budget exceeded.');
  }
  const state = (): State => ({ next: new Map(), fail: 0, outputLink: -1, outputs: [] });
  const nodes: State[] = [state()];
  owned.forEach((pattern, index) => {
    let node = 0;
    for (let i = 0; i < pattern.length; i++) {
      const character = pattern[i]!;
      let next = nodes[node]!.next.get(character);
      if (next === undefined) {
        next = nodes.length;
        nodes.push(state());
        nodes[node]!.next.set(character, next);
      }
      node = next;
    }
    nodes[node]!.outputs.push(index);
  });
  const queue = [...nodes[0]!.next.values()];
  for (let i = 0; i < queue.length; i++) {
    const parent = queue[i]!;
    for (const [character, child] of nodes[parent]!.next) {
      let fallback = nodes[parent]!.fail;
      while (fallback && !nodes[fallback]!.next.has(character)) fallback = nodes[fallback]!.fail;
      const failure = nodes[fallback]!.next.get(character) ?? 0;
      nodes[child]!.fail = failure;
      nodes[child]!.outputLink = nodes[failure]!.outputs.length
        ? failure
        : nodes[failure]!.outputLink;
      queue.push(child);
    }
  }
  return {
    patternCount: owned.length,
    stateCount: nodes.length,
    search(text, query = {}) {
      const { maxInput = 1_000_000, maxMatches = 100_000 } = query;
      budget(maxInput);
      budget(maxMatches);
      if (typeof text !== 'string' || text.length > maxInput)
        throw new TypeError('Invalid or oversized text.');
      const result: PatternMatch[] = [];
      let current = 0;
      for (let i = 0; i < text.length; i++) {
        const character = text[i]!;
        while (current && !nodes[current]!.next.has(character)) current = nodes[current]!.fail;
        current = nodes[current]!.next.get(character) ?? 0;
        for (let output = current; output !== -1; output = nodes[output]!.outputLink) {
          for (const patternIndex of nodes[output]!.outputs) {
            if (result.length >= maxMatches) throw new RangeError('Match budget exceeded.');
            result.push({ patternIndex, start: i + 1 - owned[patternIndex]!.length, end: i + 1 });
          }
        }
      }
      return result;
    },
  };
}
