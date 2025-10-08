import { Seshat } from "../lib/index";
import { performance } from "perf_hooks";

console.log("Seshat File-Streaming Benchmark");
console.log("==============================");

const trie = new Seshat();
const filePath = "./textfiles/enable1.txt";
const bufferSize = 16 * 1024 * 1024; // 16MB buffer

// Start timing
const start = performance.now();

// Insert words from file
const wordsInserted = trie.insertFromFile(filePath, bufferSize);

// End timing
const end = performance.now();

// Output results
console.log(`Words inserted: ${wordsInserted}`);
console.log(`Time taken: ${(end - start).toFixed(2)} ms`);
console.log(`bufferSize: ${bufferSize} bytes`);

// Analytics methods output
// console.log("Height Stats:", JSON.stringify(trie.getHeightStats(), null, 2));
// Format memory stats in human-readable sizes
function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const kb = bytes / 1024;
	if (kb < 1024) return `${kb.toFixed(2)} KB`;
	const mb = kb / 1024;
	if (mb < 1024) return `${mb.toFixed(2)} MB`;
	const gb = mb / 1024;
	return `${gb.toFixed(2)} GB`;
}

const memStats = trie.getMemoryStats();
const formattedMemStats: Record<string, string | number> = {};
for (const key of Object.keys(memStats) as Array<keyof typeof memStats>) {
	const value = memStats[key];
	formattedMemStats[key] = typeof value === "number" ? formatBytes(value) : value;
}
console.log("Memory Stats:", JSON.stringify(formattedMemStats, null, 2));
console.log(`Node count: ${memStats.nodeCount}`);
// console.log("Word Metrics:", JSON.stringify(trie.getWordMetrics(), null, 2));
// console.log("Pattern Search ('*a*'):", JSON.stringify(trie.patternSearch("*a*")));


// Export trie as JSON to file with benchmark
import { writeFileSync } from "fs";
const exportPath = "./trie-export.json";
const exportStart = performance.now();
const trieJson = trie.toJSON();
writeFileSync(exportPath, JSON.stringify(trieJson));
const exportEnd = performance.now();
console.log(`Trie JSON exported to ${exportPath}`);
console.log(`Export to JSON time: ${(exportEnd - exportStart).toFixed(2)} ms`);

// Import trie from JSON with benchmark
const importStart = performance.now();
const importedJson = JSON.parse(require("fs").readFileSync(exportPath, "utf8"));
const importedTrie = Seshat.fromJSON(importedJson);
const importEnd = performance.now();
console.log("Trie imported from JSON.");
console.log(`Import from JSON time: ${(importEnd - importStart).toFixed(2)} ms`);
