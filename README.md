# Seshat Trie

![Seshat](@seshat.png)

Image source: [Wikipedia — Seshat](https://en.wikipedia.org/wiki/Seshat)

Radix trie for Node.js with a C++ core and a TypeScript API.

## Install

Prerequisites: a working C/C++ toolchain for `node-gyp` (Python, make, compiler). On Linux, install your distro's build tools.

```bash
npm install seshat
```

## Quick start

```ts
import { Seshat } from "seshat";

const trie = new Seshat({ ignoreCase: false });

trie.insert("hello");
trie.insertBatch(["world", "help"]);

console.log(trie.search("hello")); // true
console.log(trie.startsWith("he")); // true
console.log(trie.getWordsWithPrefix("he")); // ["help", "hello"]

// Insert from a file (one word per line)
// Default buffer size is 1MB; you can pass a custom number of bytes as 2nd arg
// const count = trie.insertFromFile("./words.txt", 1024);

// Async variant (Node-style callback)
// trie.insertFromFileAsync("./words.txt", 1024, (err, count) => {
//   if (err) return console.error(err);
//   console.log("inserted", count);
// });
```

## API

Methods are synchronous unless noted.

- **constructor(options?)**
  - `options.words?: string[]` initial words to insert
  - `options.ignoreCase?: boolean` default `false`

- **insert(word: string): void**
- **insertBatch(words: string[]): number** returns count inserted
- **insertFromFile(filePath: string, bufferSize?: number): number** words per line
- **insertFromFileAsync(filePath: string, bufferSize?: number, cb: (err: Error | null, count?: number) => void): void**

- **search(word: string): boolean**
- **searchBatch(words: string[]): boolean[]**

- **startsWith(prefix: string): boolean**
- **getWordsWithPrefix(prefix: string): string[]**

- **remove(word: string): boolean**
- **removeBatch(words: string[]): boolean[]**
- **removeMany(words: string[]): boolean[]** (helper built on `remove`)

- **isEmpty(): boolean**
- **size(): number**
- **clear(): void**

- **getStats(): { wordCount: number; isEmpty: boolean; allWords: string[] }**
- **getHeightStats(): { minHeight: number; maxHeight: number; averageHeight: number; modeHeight: number; allHeights: number[] }**
- **getMemoryStats(): { totalBytes: number; nodeCount: number; stringBytes: number; overheadBytes: number; bytesPerWord: number }**
- **getWordMetrics(): { minLength: number; maxLength: number; averageLength: number; modeLength: number; lengthDistribution: number[]; totalCharacters: number }**

- **patternSearch(pattern: string): string[]** supports `*` and `?` wildcards

- **toJSON(): { words: string[]; options: { ignoreCase: boolean } }**
- **static fromJSON(json): Seshat**
- **static fromWords(words: string[], options?): Seshat**

### Errors and validation

- Empty or whitespace-only words throw on `insert`.
- Non-string inputs throw where a string is required.
- `insertFromFile` throws if `bufferSize` is not a positive number or file read fails.
- `insertFromFileAsync` reports errors via the callback `err` parameter.

### Case handling

When `ignoreCase` is `true`, inputs are lowercased internally. Returned words reflect stored (normalized) casing.

## File input format

- `insertFromFile` reads a UTF-8 text file.
- One word per line.
- Default buffer size is 1MB; pass `bufferSize` in bytes to override.

## Benchmarks (optional)

Prepare word lists:

```bash
npm run setupTextFiles
```

Run benchmarks:

```bash
npm run benchmark
npm run benchmark:filestream
```

## Development

Build native addon and TypeScript:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Entry points:

- Runtime: `dist/index.js`
- Types: `dist/index.d.ts`
- Native addon: `build/Release/seshat.node`

## License

MIT