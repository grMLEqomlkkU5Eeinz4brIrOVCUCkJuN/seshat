# Benchmark Results

## Latest results

Linux 7.1.4-arch1-1, Node v26.4.0, i7-1255U

`npm run benchmark`. Read the **median** column; CV% is run-to-run noise (the
machine was under normal load, not isolated for benchmarking). Two framing
notes so the numbers aren't read as more than they are:

- **N-API floor** rows run against a 1-word trie. They isolate the JS/C++
  round-trip cost with traversal held ~zero, so they are a *ceiling* a caller
  can never beat, not search throughput. Do not quote them as search speed.
- **Corpus Search** rows run against the full `terms.txt` trie (6.27M words) —
  what a caller actually gets. The gap between the floor and these rows is the
  real cost of walking the trie. A hit and a deep miss traverse almost the same
  path, so they cost about the same; a shallow miss rejects at the root and is
  far cheaper.

```text
Seshat Stable Performance Benchmarks
=====================================
Using multiple runs with warm-up and statistical analysis
CV% = Coefficient of Variation (lower is more stable)

=== Analytics Methods ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
getHeightStats           294,841        317,773     37.2    155772-446393
getMemoryStats           604,980        620,197     13.4    428137-724270
getWordMetrics           442,806        467,307     9.5     365716-482409
patternSearch('*a*')     616,653        645,494     19.7    418717-805458

=== Core Operations ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
Insert                   1,361,115      1,416,669   23.5    809999-1857072
N-API floor (1-word trie)7,294,160      7,965,018   18.6    4009205-8271025
N-API floor miss (1-word)7,742,094      8,127,570   10.0    5793407-8215172
Remove (miss)            7,241,346      8,067,965   21.7    4007438-8401032
Remove+reinsert (hit)    2,818,138      2,860,600   19.4    1672216-3529790

=== Corpus Search (real-world) ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
Search hit               455,713        556,107     41.6    191992-655120
Search miss, deep        563,575        557,934     15.6    360731-717219
Search miss, shallow     2,698,963      2,137,593   53.7    755399-4957981

=== Batch vs Individual ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
Individual Insert 100    53,773         54,952      6.3     43868-56241
Batch Insert 100         44,084         49,460      18.8    31504-51908
Buffer Insert 100        163,406        178,072     16.3    119036-186661
Individual Search 100    64,085         64,677      2.6     59212-64984
Batch Search 100         38,627         39,576      4.1     35094-39853
Individual Remove 100    21,829         24,960      22.3    10876-25618
Batch Remove 100         19,931         20,325      3.6     18343-20789
Buffer Remove 100        72,843         75,364      8.7     54304-75918

=== Prefix Operations ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
startsWith (hit)         3,742,307      3,294,676   36.5    1703490-5644615
startsWith (miss)        5,079,978      4,808,617   30.6    2569043-7305136
wordsWithPrefix('hel')   988,065        1,176,152   28.7    739957-1284126

=== System Stability Check ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
CPU Stability            702,911        715,943     3.9     578142-732842
```

## Historical runs

Older runs on different machines, kernels, and Seshat versions. Kept for the
memory and serialization work they document; **not** directly comparable to the
Latest results above (different hardware and versions). Where these predate the
`Search (hit)/(miss)` rename, the 1-word rows are relabelled to `N-API floor` in
place so nothing here reads as real search throughput.

### Memory optimization (Linux 7.0.10-arch1-1, Node v24.15.0, i7-1255U)

Three memory passes layered on top of each other:

1. Dropped the redundant first-character cached next to every child pointer
   (it always equals `child->key.front()`), halving the children buffer.
2. Pool-allocated `RadixNode` to strip the per-node allocator header from RSS.
3. Replaced the 32-byte `std::string` key with a 16-byte `CompactKey`
   (15 bytes inline, heap spill beyond), taking the node from 64 to 48 bytes.

#### Memory footprint (terms.txt - 6,273,234 keys, 9,117,043 nodes)

`terms.txt` is a non-normalized n-gram frequency file: each line is
`<phrase>\t<count>` (multi-word phrases, tab, frequency digits). The loader
inserts each whole line as one key, so these keys **include the tab and count**
(e.g. `academy award\t261`), not just the phrase.

| Stage                         | bytes/word | totalBytes | structBytes | childBufferBytes |
|-------------------------------|-----------:|-----------:|------------:|-----------------:|
| Baseline                      |     120.95 |  723.57 MB |   556.46 MB |        166.33 MB |
| + edge-char drop + node pool  |     107.04 |  640.40 MB |   556.46 MB |         83.17 MB |
| + CompactKey (32 to 16 B key) |  **83.75** | **501.06 MB** | **417.35 MB** |     83.17 MB |

Net: **-30.8% bytes/word, -222 MB** versus baseline, with the children buffer
halved by the edge-char drop and `structBytes` cut by the smaller key.

**Raw vs. phrase-only.** The 501.06 MB above includes ~10.5% of structure that
exists only to store the frequency-count suffix. Stripping the count column
(`terms-clean.txt`, phrase-only) gives the footprint of an actual phrase trie:

| Dataset                       | keys      | nodes     | totalBytes | B/word |
|-------------------------------|----------:|----------:|-----------:|-------:|
| `terms.txt` (with `\tcount`)  | 6,273,234 | 9,117,043 |  501.06 MB |  83.75 |
| `terms-clean.txt` (phrase)    | 6,273,234 | 8,163,324 |  448.29 MB |  74.93 |

**`totalBytes` is not RSS.** It is the trie's self-accounting (node structs, key
bytes, child buffers). Measured process RSS holding `terms.txt` is **~646 MB
above baseline, ~733 MB resident** (Node runtime, V8 heap, and the ~91 MB source
buffer on top of the trie). Quote `totalBytes` for the structure cost and RSS
for "how much RAM the process needs" — they are different numbers.

#### Main Benchmarks

```text
=== Analytics Methods ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
getHeightStats           613,766        656,254     9.5     531994-680953
getMemoryStats           862,173        928,445     20.2    374047-988953
getWordMetrics           557,495        590,929     12.9    351108-601583
patternSearch('*a*')     833,105        920,217     14.5    639627-982646

=== Core Operations ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
Insert                   1,300,772      1,443,747   25.7    723118-1600725
N-API floor (1-word)     8,996,523      9,537,253   19.7    3436958-10329085
N-API floor miss (1-word)9,800,905     10,368,604   17.9    5028107-11298924
Remove (miss)            9,397,576      9,840,873   19.8    3769701-10931351
Remove+reinsert (hit)    4,061,103      4,342,709   14.7    2408344-4591832

=== Batch vs Individual ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
Individual Insert 100    61,006         62,930      14.3    45104-71058
Batch Insert 100         53,679         57,796      13.4    37205-61053
Buffer Insert 100        172,855        182,289     15.7    92005-186425
Individual Search 100    73,000         74,453      6.3     59245-75305
Batch Search 100         45,317         46,762      8.5     37269-49383
Individual Remove 100    26,778         27,667      4.6     24600-27953
Batch Remove 100         24,190         24,496      3.3     22320-24886
Buffer Remove 100        75,960         77,760      4.7     65629-77982

=== Prefix Operations ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
startsWith (hit)         5,350,906      6,097,561   28.4    1371084-6335128
startsWith (miss)        7,926,583      8,752,735   25.6    3840098-9634840
wordsWithPrefix('hel')   1,368,332      1,473,514   11.9    1136945-1545738

=== System Stability Check ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
CPU Stability            741,213        749,260     2.4     681779-749395
```

> Note: the Core Operations `N-API floor` rows above are the old 1-word-trie
> `Search (hit)/(miss)` measurements, relabelled. They are an N-API ceiling, not
> corpus search throughput.

#### File Streaming & Serialization (terms.txt - 6.3M words)

```text
--- insertFromFile ---
Words inserted: 6273234
Time taken: 971.59 ms
bufferSize: 16777216 bytes
Memory Stats: {
  "totalBytes": "501.06 MB",
  "nodeCount": "8.69 MB",
  "stringBytes": "39.38 MB",
  "structBytes": "417.35 MB",
  "childBufferBytes": "83.17 MB",
  "stringBufferBytes": "557.34 KB",
  "overheadBytes": "461.67 MB",
  "bytesPerWord": "83.75200813487908 B"
}
Node count: 9117043

--- JSON serialization ---
Export to JSON time: 2809.77 ms
Import from JSON time: 2621.05 ms
Verified word count: 6273234

--- Buffer serialization ---
Export to Buffer time: 504.04 ms
Buffer size: 91.14 MB
Import from Buffer time: 859.97 ms
Verified word count: 6273234

--- insertFromBuffer ---
Words inserted: 6273234
Time taken: 995.72 ms

--- insertFromStream ---
Words inserted: 6273234
Time taken: 1616.82 ms

--- Summary ---
Method                          Time (ms)      Words
----------------------------------------------------
insertFromFile                     971.59    6273234
insertFromBuffer                   995.72    6273234
insertFromStream                  1616.82    6273234
JSON export                       2809.77
JSON import                       2621.05    6273234
Buffer export (toBuffer)           504.04
Buffer import (fromBuffer)         859.97    6273234
```

Insertion also improved alongside the memory cuts: `insertFromFile` 1334 to
972 ms and `insertFromStream` 2924 to 1617 ms versus the pre-optimization
buffer-and-stream run below, from the pool allocator and the smaller, more
cache-friendly node.

### Buffer & serialization (Linux 7.0.2-arch1-1, Node v25.9.0, i7-1255U)

#### Main Benchmarks (with Buffer Insert)

```text
=== Analytics Methods ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
getHeightStats           634,121        630,310     7.7     580370-711445
getMemoryStats           1,135,234      1,193,204   11.8    964422-1335898
getWordMetrics           569,741        576,758     9.8     457252-643021
patternSearch('*a*')     744,414        759,896     6.4     660232-819128

=== Core Operations ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
Insert                   1,327,707      1,431,219   21.4    780577-1643747
N-API floor (1-word)     8,689,075      8,934,954   19.2    3868233-9914733
N-API floor miss (1-word)8,939,549      9,384,561   12.6    6211180-10196590

=== Batch vs Individual ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
Individual Insert 100    47,643         49,586      6.7     41242-51263
Batch Insert 100         43,880         46,589      10.3    33508-47532
Buffer Insert 100        124,219        128,059     6.6     102292-129879
Individual Search 100    73,453         75,566      7.3     57414-75850
Batch Search 100         46,552         47,010      2.3     43392-47223

=== System Stability Check ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
CPU Stability            744,295        749,266     1.6     697243-749412
```

Buffer Insert is ~2.8x faster than Batch Insert and ~2.6x faster than Individual
Insert for 100-word batches, by bypassing per-word N-API marshalling.

#### Serialization speedup vs JSON (6.3M words)

| Operation | JSON    | Buffer  | Speedup  |
|-----------|---------|---------|----------|
| Export    | 2802 ms | 543 ms  | **5.2x** |
| Import    | 2740 ms | 1156 ms | **2.4x** |

#### Insertion method comparison (6.3M words)

| Method           | Time    | Notes                                    |
|------------------|---------|------------------------------------------|
| insertFromBuffer | 1258 ms | Fastest, data already in memory          |
| insertFromFile   | 1334 ms | C++ file I/O with configurable buffer    |
| insertFromStream | 2924 ms | Streams from disk, chunk-by-chunk        |

### Per-corpus file-streaming footprints (Linux 6.19.11-arch1-1, Seshat 1.0.1)

Memory footprint and load time of `insertFromFile` across word lists of very
different sizes (terms.txt data from
<https://github.com/wolfgarbe/PruningRadixTrie/tree/master/PruningRadixTrie>).
These predate the memory optimizations above, so `bytesPerWord` is the old,
higher baseline.

| Corpus       |     Words | Load time | Nodes     | bytes/word | totalBytes |
|--------------|----------:|----------:|----------:|-----------:|-----------:|
| terms.txt    | 6,273,234 | 1252.9 ms | 9,117,043 |     122.85 |  734.96 MB |
| words.txt    | 3,080,821 |  848.5 ms | 3,592,260 |      95.57 |  280.80 MB |
| enable1.txt  |   172,820 |   31.3 ms |   213,653 |     101.15 |   16.67 MB |
| badwords.txt |       458 |    2.7 ms |       607 |     114.31 |   48.90 KB |
```
