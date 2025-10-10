Microsoft windows 17-1255u 16GB LPDDR4 SODIMM single channel.

Due to the way that this thing was set up, it runs too fast for me to change the CPU affinity on windows and for some reason the command line behaviour is inconsistent. Therefore, there is no way for me to set it to a specific core, I am just hoping it runs on a P core lol.
# Main Benchmarks

```

> seshat-trie@1.0.0 benchmark
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
getHeightStats           419,775        429,738     6.4     351617-444050       
getMemoryStats           903,245        938,967     9.0     665336-943396       
getWordMetrics           373,385        378,501     5.7     310366-387447
patternSearch('*a*')     506,985        628,141     29.4    338639-673401
  Running: Insert
  Warming up...
  Running: Search (hit)
  Warming up...
  Running: Search (miss)
  Warming up...

=== Core Operations ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
Insert                   1,264,372      1,248,907   13.8    996214-1540832
Search (hit)             5,291,672      5,998,800   24.5    3469813-6784261
Search (miss)            6,552,249      7,241,130   17.1    4833253-7722008
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
Individual Insert 100    30,120         30,553      12.5    24184-39417
Batch Insert 100         36,571         37,230      25.1    16869-42319
Individual Search 100    45,280         47,619      15.1    33036-54259
Batch Search 100         36,296         37,608      7.4     30276-38745
  Running: CPU Stability
  Warming up...

=== System Stability Check ===
Test Name                Mean Ops/sec   Median      CV%     Range
--------------------------------------------------------------------------------
CPU Stability            674,163        682,128     1.5     649351-682594

=== Variance Analysis ===
CV% < 5%:  Excellent stability
CV% 5-10%: Good stability
CV% 10-20%: Moderate variance
CV% > 20%: High variance (system load/thermal throttling)

High Variance Detected:
  - Search (hit): 24.5% CV
  - Search (miss): 17.1% CV
  - Batch Insert 100: 25.1% CV
  - Individual Search 100: 15.1% CV

Recommendations:
  1. Close unnecessary applications
  2. Ensure laptop is plugged in (not on battery)
  3. Set Windows power plan to 'High Performance'
  4. Run: node --expose-gc benchmark/stable-benchmark.ts
  5. Let laptop cool down if warm
```

# File Streaming Benches
```

// Terms.txt file from https://github.com/wolfgarbe/PruningRadixTrie/tree/master/PruningRadixTrie
> seshat-internal@1.0.0 benchmark:filestream
> ts-node benchmarks/filestream.ts

Seshat File-Streaming Benchmark
==============================
Words inserted: 6273234
Time taken: 1507.74 ms
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
Export to JSON time: 5606.01 ms
Trie imported from JSON.
Import from JSON time: 4877.32 ms

// Enable Text file
> seshat-trie@1.0.0 benchmark:filestream
> ts-node benchmarks/filestream.ts

Seshat File-Streaming Benchmark
==============================
Words inserted: 172820
Time taken: 38.36 ms
bufferSize: 2097152 bytes
Memory Stats: {
  "totalBytes": "16.67 MB",
  "nodeCount": "208.65 KB",
  "stringBytes": "378.79 KB",
  "overheadBytes": "16.30 MB",
  "bytesPerWord": "101.1464876750376 B"
}
Node count: 213653
Trie JSON exported to ./trie-export.json
Export to JSON time: 55.34 ms
Trie imported from JSON.
Import from JSON time: 97.17 ms


// Google's bad word list
> seshat-trie@1.0.0 benchmark:filestream
> ts-node benchmarks/filestream.ts

Seshat File-Streaming Benchmark
==============================
Words inserted: 458
Time taken: 0.43 ms
bufferSize: 524288 bytes
Memory Stats: {
  "totalBytes": "48.90 KB",
  "nodeCount": "607 B",
  "stringBytes": "1.46 KB",
  "overheadBytes": "47.44 KB",
  "bytesPerWord": "114.31278538812785 B"
}
Node count: 607
Trie JSON exported to ./trie-export.json
Export to JSON time: 0.55 ms
Trie imported from JSON.
Import from JSON time: 0.55 ms

// words.txt
> seshat-trie@1.0.0 benchmark:filestream
> ts-node benchmarks/filestream.ts

Seshat File-Streaming Benchmark
==============================
Words inserted: 3080821
Time taken: 1092.15 ms
bufferSize: 20971520 bytes // yes for some reason this worked best at 20MB, I don't know why
Memory Stats: {
  "totalBytes": "280.80 MB",
  "nodeCount": "3.43 MB",
  "stringBytes": "6.73 MB",
  "overheadBytes": "274.07 MB",
  "bytesPerWord": "95.57179953006033 B"
}
Node count: 3592260
Trie JSON exported to ./trie-export.json
Export to JSON time: 1715.42 ms
Trie imported from JSON.
Import from JSON time: 2233.47 ms
```