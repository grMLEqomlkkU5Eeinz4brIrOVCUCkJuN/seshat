# Seshat Trie

![Seshat](https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Hatshepsut_and_Seshat.jpg/960px-Hatshepsut_and_Seshat.jpg)

Image source: [Wikipedia - Seshat](https://en.wikipedia.org/wiki/Seshat)

A high-performance radix trie (prefix tree) for Node.js with a C++ core and TypeScript API.

## What is this?

A radix trie implementation with C++ performance for fast prefix-based searches. Useful for autocomplete, spell checking, and dictionary lookups where you need to quickly find words by their prefixes.

## Install

Prerequisites: a working C/C++ toolchain for `node-gyp` (Python, make, compiler). On Linux, install your distro's build tools. This happened because of the way a few of my accounts are set up (some of my accounts are for school and whatnot, which have 2FA mandatorily enabled, breaking github actions and more)

```bash
npm install seshat-trie
```

## Performance-Notes
Due to N-API overhead when crossing the JavaScript/C++ boundary, individual operations (especially small batch inserts) may be slower than expected on some systems (higher single-core performance is better for this library). For bulk insertions, use `insertFromFile()`, `insertFromBuffer()`, or `insertFromStream()` which bypass per-word N-API marshalling. For serialization, `toBuffer()`/`fromBuffer()` are significantly faster than `toJSON()`/`fromJSON()` (5.7x export, 3.1x import on 3M words).

## Benchmarks

Honestly a little nervous about this, but there is a [Benchmarks results file](./benchmarks/benchmark.md). Hope you enjoy this repo. (I felt like this project may have under performed in some ways I did not expect after working on the C++ version)

## Data format samples

### JSON format (used by `toJSON`/`fromJSON`)

```json
{
	"words": [
		"aa",
		"aah",
		"aahed",
		"aahing",
		"aahs",
		"aal",
		"aalii",
		"aaliis",
		"aals"
	],
	"options": {
		"ignoreCase": false
	}
}
```

### Buffer format (used by `toBuffer`/`fromBuffer`/`insertFromBuffer`/`insertFromStream`)

Newline-delimited UTF-8 text — the same format as the text files used by `insertFromFile`:

```
aa
aah
aahed
aahing
aahs
```

### OS prerequisites for local compilation

- Linux

  - Python 3, make, C/C++ compiler and headers
  - Debian/Ubuntu: `sudo apt-get install -y build-essential python3`
  - Fedora/RHEL: `sudo dnf install -y @development-tools python3`
  - Arch: `sudo pacman -S --needed base-devel python`

- macOS

  - Xcode Command Line Tools and Python 3
  - Install: `xcode-select --install` and `brew install python`

- Windows
  - Visual Studio Build Tools (workload: Desktop development with C++) and Python 3
  - Python: `winget install Python.Python.3.11` or download from python.org
  - If multiple VS versions are installed: `npm config set msvs_version 2019` (or 2022)

Supported Node versions: Node 18, 20, or 22 (see `engines` field). `npm install` will build the native addon locally via node-gyp.

## Quick start

```ts
import { Seshat } from "seshat-trie";

const trie = new Seshat({ ignoreCase: false });

trie.insert("hello");
trie.insertBatch(["world", "help"]);

console.log(trie.search("hello")); // true
console.log(trie.startsWith("he")); // true
console.log(trie.getWordsWithPrefix("he")); // ["help", "hello"]

// Insert from a file (one word per line)
// Default buffer size is 1MB; you can pass a custom number of bytes as 2nd arg
// const count = trie.insertFromFile("./words.txt", 1024);

// Insert from a Buffer (bypasses per-word N-API overhead)
// const buf = fs.readFileSync("./words.txt");
// const count = trie.insertFromBuffer(buf);

// Insert from a Readable stream (handles chunk boundaries automatically)
// const count = await trie.insertFromStream(fs.createReadStream("./words.txt"));

// Fast binary serialization (5-6x faster export, 3x faster import vs JSON)
// const buf = trie.toBuffer();
// fs.writeFileSync("./trie.dat", buf);
// const restored = Seshat.fromBuffer(fs.readFileSync("./trie.dat"));
```

## API

Methods are synchronous unless noted.

- **constructor(options?)**

  - `options.words?: string[]` initial words to insert
  - `options.ignoreCase?: boolean` default `false`
  - `options.maxSize?: number` maximum number of words (throws on overflow; not enforced for file-based insertion)

- **insert(word: string): void**
- **insertBatch(words: string[]): number** returns count inserted
- **insertFromFile(filePath: string, bufferSize?: number): number** words per line
- **insertFromFileAsync(filePath: string, bufferSize?: number, cb: (err: Error | null, count?: number) => void): void**
- **insertFromBuffer(buffer: Buffer): number** bulk insert from a newline-delimited Buffer, bypassing per-word N-API overhead
- **insertFromStream(stream: Readable): Promise\<number\>** insert from a Readable stream with automatic chunk-boundary handling

- **search(word: string): boolean**
- **searchBatch(words: string[]): boolean[]**

- **startsWith(prefix: string): boolean**
- **getWordsWithPrefix(prefix: string): string[]**

- **remove(word: string): boolean**
- **removeBatch(words: string[]): boolean[]**

- **isEmpty(): boolean**
- **size(): number**
- **clear(): void**

- **getStats(): { wordCount: number; isEmpty: boolean; allWords: string[] }**
- **getHeightStats(): { minHeight: number; maxHeight: number; averageHeight: number; modeHeight: number; allHeights: number[] }**
- **getMemoryStats(): { totalBytes: number; nodeCount: number; stringBytes: number; overheadBytes: number; bytesPerWord: number }**
- **getWordMetrics(): { minLength: number; maxLength: number; averageLength: number; modeLength: number; lengthDistribution: number[]; totalCharacters: number }**

- **patternSearch(pattern: string): string[]** supports `*` and `?` wildcards

- **toJSON(): { words: string[]; options: { ignoreCase: boolean } }**
- **toBuffer(): Buffer** serialize to a newline-delimited Buffer (5-6x faster than toJSON)
- **static fromJSON(json): Seshat**
- **static fromBuffer(buffer: Buffer, options?): Seshat** deserialize from a Buffer (3x faster than fromJSON)
- **static fromWords(words: string[], options?): Seshat**

### Errors and validation

- Empty or whitespace-only words throw on `insert`.
- Non-string inputs throw where a string is required.
- `insertFromFile` throws if `bufferSize` is not a positive number or file read fails.
- `insertFromFileAsync` reports errors via the callback `err` parameter.
- `insertFromBuffer` and `fromBuffer` throw if the argument is not a `Buffer`.
- `insertFromStream` rejects the returned promise if the stream emits an error.

### Case handling

When `ignoreCase` is `true`, inputs are lowercased internally for matching, but original casing is preserved. Methods like `getWordsWithPrefix`, `toJSON`, and `patternSearch` return words in their original casing as inserted.

## File / Buffer / Stream input format

- `insertFromFile`, `insertFromBuffer`, and `insertFromStream` all expect UTF-8 newline-delimited text (one word per line).
- Line endings: LF, CRLF, and CR are all supported. Leading/trailing whitespace per line is trimmed.
- `insertFromFile` default buffer size is 1MB; pass `bufferSize` in bytes to override.
- `insertFromStream` handles words split across chunk boundaries automatically.

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