Microsoft windows 17-1255u 16GB LPDDR4 SODIMM single channel.
terms.txt refers to https://github.com/wolfgarbe/PruningRadixTrie/tree/master/PruningRadixTrie
```
npm run benchmark:filestream

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
```