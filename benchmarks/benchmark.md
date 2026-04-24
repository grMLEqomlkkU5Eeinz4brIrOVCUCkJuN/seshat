# Benchmark Results

Linux 6.19.11-arch1-1

## Main Benchmarks

Run 1:

```text
> seshat-trie@1.0.1 benchmark
> ts-node benchmarks/benchmark.ts

Seshat Stable Performance Benchmarks
=====================================
Using multiple runs with warm-up and statistical analysis
CV% = Coefficient of Variation (lower is more stable)
  Running: getHeightStats
  Warming up...
  Running: getMemoryStats
  Warming up...
  Running: getWordMetrics
  Warming up...
  Running: patternSearch('*a*')
  Warming up...

=== Analytics Methods ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
getHeightStats           589,958        623,220     11.0    494445-668092
getMemoryStats           1,114,528      1,204,456   13.2    814883-1227762
getWordMetrics           594,954        622,607     7.4     531460-648929
patternSearch('*a*')     807,818        845,766     10.8    634965-941708
  Running: Insert
  Warming up...
  Running: Search (hit)
  Warming up...
  Running: Search (miss)
  Warming up...

=== Core Operations ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
Insert                   1,682,521      1,685,687   21.4    807998-2045546
Search (hit)             9,072,445      9,606,240   18.1    4441996-10219933
Search (miss)            8,361,319      8,768,622   11.6    5536210-9275233
  Running: Individual Insert 100
  Warming up...
  Running: Batch Insert 100
  Warming up...
  Running: Individual Search 100
  Warming up...
  Running: Batch Search 100
  Warming up...

=== Batch vs Individual ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
Individual Insert 100    53,023         51,358      9.7     46512-63269
Batch Insert 100         42,633         47,296      13.2    33546-48430
Individual Search 100    73,905         75,187      3.6     66496-75545
Batch Search 100         42,437         42,262      5.3     38434-46158
  Running: CPU Stability
  Warming up...

=== System Stability Check ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
CPU Stability            764,417        765,949     0.4     755886-766072

=== Variance Analysis ===
CV% < 5%:  Excellent stability
CV% 5-10%: Good stability
CV% 10-20%: Moderate variance
CV% > 20%: High variance (system load/thermal throttling)

High Variance Detected:
  - Insert: 21.4% CV
  - Search (hit): 18.1% CV

Recommendations:
  1. Close unnecessary applications
  2. Ensure laptop is plugged in (not on battery)
  3. Set Windows power plan to 'High Performance'
  4. Run: node --expose-gc benchmark/stable-benchmark.ts
  5. Let laptop cool down if warm
```

Run 2:

```text
> seshat-trie@1.0.1 benchmark
> ts-node benchmarks/benchmark.ts

Seshat Stable Performance Benchmarks
=====================================
Using multiple runs with warm-up and statistical analysis
CV% = Coefficient of Variation (lower is more stable)
  Running: getHeightStats
  Warming up...
  Running: getMemoryStats
  Warming up...
  Running: getWordMetrics
  Warming up...
  Running: patternSearch('*a*')
  Warming up...

=== Analytics Methods ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
getHeightStats           597,379        623,877     9.6     502142-668400
getMemoryStats           1,096,290      1,198,638   14.1    816587-1251126
getWordMetrics           579,285        606,984     9.7     487194-646517
patternSearch('*a*')     798,712        827,438     9.3     651534-907803
  Running: Insert
  Warming up...
  Running: Search (hit)
  Warming up...
  Running: Search (miss)
  Warming up...

=== Core Operations ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
Insert                   1,753,150      1,814,056   15.3    1074939-2018779
Search (hit)             8,909,550      9,638,554   18.7    4079218-9831682
Search (miss)            9,109,749      10,001,800  15.6    6038283-10077598
  Running: Individual Insert 100
  Warming up...
  Running: Batch Insert 100
  Warming up...
  Running: Individual Search 100
  Warming up...
  Running: Batch Search 100
  Warming up...

=== Batch vs Individual ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
Individual Insert 100    51,270         51,781      8.2     40840-57111
Batch Insert 100         42,323         43,650      11.8    34600-48084
Individual Search 100    72,582         74,854      7.5     58326-76706
Batch Search 100         45,357         46,144      2.7     42813-46231
  Running: CPU Stability
  Warming up...

=== System Stability Check ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
CPU Stability            744,243        749,322     1.8     690203-749457

=== Variance Analysis ===
CV% < 5%:  Excellent stability
CV% 5-10%: Good stability
CV% 10-20%: Moderate variance
CV% > 20%: High variance (system load/thermal throttling)

High Variance Detected:
  - Insert: 15.3% CV
  - Search (hit): 18.7% CV
  - Search (miss): 15.6% CV

Recommendations:
  1. Close unnecessary applications
  2. Ensure laptop is plugged in (not on battery)
  3. Set Windows power plan to 'High Performance'
  4. Run: node --expose-gc benchmark/stable-benchmark.ts
  5. Let laptop cool down if warm
```

## File Streaming Benches

Run 1 (terms.txt):

```text
// Terms.txt file from https://github.com/wolfgarbe/PruningRadixTrie/tree/master/PruningRadixTrie
> seshat-trie@1.0.1 benchmark:filestream
> ts-node benchmarks/filestream.ts

Seshat File-Streaming Benchmark
==============================
Words inserted: 6273234
Time taken: 1252.86 ms
bufferSize: 16777216 bytes
Memory Stats: {
  "totalBytes": "734.96 MB",
  "nodeCount": "8.69 MB",
  "stringBytes": "39.38 MB",
  "overheadBytes": "695.58 MB",
  "bytesPerWord": "122.84912311576453 B"
}
Node count: 9117043
Trie JSON exported to ./trie-export.json
Export to JSON time: 2586.85 ms
Trie imported from JSON.
Import from JSON time: 2842.91 ms
```

Run 2 (terms.txt):

```text
// Terms.txt file from https://github.com/wolfgarbe/PruningRadixTrie/tree/master/PruningRadixTrie
> seshat-trie@1.0.1 benchmark:filestream
> ts-node benchmarks/filestream.ts

Seshat File-Streaming Benchmark
==============================
Words inserted: 6273234
Time taken: 1253.06 ms
bufferSize: 33554432 bytes
Memory Stats: {
  "totalBytes": "734.96 MB",
  "nodeCount": "8.69 MB",
  "stringBytes": "39.38 MB",
  "overheadBytes": "695.58 MB",
  "bytesPerWord": "122.84912311576453 B"
}
Node count: 9117043
Trie JSON exported to ./trie-export.json
Export to JSON time: 2647.83 ms
Trie imported from JSON.
Import from JSON time: 2842.03 ms
```

enable1.txt:

```text
> seshat-trie@1.0.1 benchmark:filestream
> ts-node benchmarks/filestream.ts

Seshat File-Streaming Benchmark
==============================
Words inserted: 172820
Time taken: 31.32 ms
bufferSize: 16777216 bytes
Memory Stats: {
  "totalBytes": "16.67 MB",
  "nodeCount": "208.65 KB",
  "stringBytes": "378.79 KB",
  "overheadBytes": "16.30 MB",
  "bytesPerWord": "101.1464876750376 B"
}
Node count: 213653
Trie JSON exported to ./trie-export.json
Export to JSON time: 56.68 ms
Trie imported from JSON.
Import from JSON time: 80.54 ms
```

words.txt:

```text
> seshat-trie@1.0.1 benchmark:filestream
> ts-node benchmarks/filestream.ts

Seshat File-Streaming Benchmark
==============================
Words inserted: 3080821
Time taken: 848.45 ms
bufferSize: 16777216 bytes
Memory Stats: {
  "totalBytes": "280.80 MB",
  "nodeCount": "3.43 MB",
  "stringBytes": "6.73 MB",
  "overheadBytes": "274.07 MB",
  "bytesPerWord": "95.57179953006033 B"
}
Node count: 3592260
Trie JSON exported to ./trie-export.json
Export to JSON time: 1048.50 ms
Trie imported from JSON.
Import from JSON time: 1460.10 ms
```

badwords.txt:

```text
> seshat-trie@1.0.1 benchmark:filestream
> ts-node benchmarks/filestream.ts

Seshat File-Streaming Benchmark
==============================
Words inserted: 458
Time taken: 2.68 ms
bufferSize: 16777216 bytes
Memory Stats: {
  "totalBytes": "48.90 KB",
  "nodeCount": "607 B",
  "stringBytes": "1.46 KB",
  "overheadBytes": "47.44 KB",
  "bytesPerWord": "114.31278538812785 B"
}
Node count: 607
Trie JSON exported to ./trie-export.json
Export to JSON time: 0.27 ms
Trie imported from JSON.
Import from JSON time: 0.43 ms
```

## Buffer & Stream Benchmarks

Linux 6.19.14-arch1-1

### Main Benchmarks (with Buffer Insert)

```text
Seshat Stable Performance Benchmarks
=====================================
Using multiple runs with warm-up and statistical analysis
CV% = Coefficient of Variation (lower is more stable)

=== Analytics Methods ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
getHeightStats           148,830        128,799     36.1    94523-249043
getMemoryStats           419,340        447,081     14.9    306695-497926
getWordMetrics           102,203        104,133     7.4     87555-113928
patternSearch('*a*')     279,501        305,251     15.3    216687-340035

=== Core Operations ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
Insert                   685,536        696,046     11.1    433130-749262
Search (hit)             3,301,008      3,513,617   16.2    1658199-3645444
Search (miss)            3,541,125      3,717,486   11.5    2500269-3883329

=== Batch vs Individual ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
Individual Insert 100    21,732         22,454      6.4     18703-22814
Batch Insert 100         17,789         17,766      15.8    11602-21562
Buffer Insert 100        74,402         78,726      11.2    51657-79277
Individual Search 100    27,120         27,391      4.4     24794-28455
Batch Search 100         17,022         17,278      2.7     15904-17557

=== System Stability Check ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
CPU Stability            281,653        283,054     0.7     276132-283082
```

Buffer Insert is ~4.2x faster than Batch Insert and ~3.4x faster than Individual Insert
for 100-word batches, by bypassing per-word N-API marshalling.

### File Streaming & Serialization (words.txt — 3M words)

```text
Seshat File-Streaming Benchmark
==============================

--- insertFromFile ---
Words inserted: 3080821
Time taken: 2372.01 ms
bufferSize: 16777216 bytes
Memory Stats: {
  "totalBytes": "280.80 MB",
  "nodeCount": "3.43 MB",
  "stringBytes": "6.73 MB",
  "overheadBytes": "274.07 MB",
  "bytesPerWord": "95.57179953006033 B"
}
Node count: 3592260

--- JSON serialization ---
Export to JSON time: 2824.85 ms
Import from JSON time: 3624.97 ms
Verified word count: 3080821

--- Buffer serialization ---
Export to Buffer time: 497.23 ms
Buffer size: 27.46 MB
Import from Buffer time: 1168.30 ms
Verified word count: 3080821

--- insertFromBuffer ---
Words inserted: 3080821
Time taken: 1187.21 ms

--- insertFromStream ---
Words inserted: 3080821
Time taken: 2269.48 ms

--- Summary ---
Method                          Time (ms)      Words
----------------------------------------------------
insertFromFile                    2372.01    3080821
insertFromBuffer                  1187.21    3080821
insertFromStream                  2269.48    3080821
JSON export                       2824.85
JSON import                       3624.97    3080821
Buffer export (toBuffer)           497.23
Buffer import (fromBuffer)        1168.30    3080821
```

### Serialization speedup vs JSON (3M words)

| Operation | JSON    | Buffer  | Speedup  |
|-----------|---------|---------|----------|
| Export    | 2825 ms | 497 ms  | **5.7x** |
| Import    | 3625 ms | 1168 ms | **3.1x** |

### Insertion method comparison (3M words)

| Method           | Time    | Notes                                 |
|------------------|---------|---------------------------------------|
| insertFromBuffer | 1187 ms | Fastest — data already in memory      |
| insertFromStream | 2270 ms | Streams from disk, chunk-by-chunk     |
| insertFromFile   | 2372 ms | C++ file I/O with configurable buffer |
