import { Seshat } from "../lib/index";
import { performance } from "perf_hooks";
import { writeFileSync, readFileSync, createReadStream } from "fs";

console.log("Seshat File-Streaming Benchmark");
console.log("==============================");

const filePath = "./textfiles/terms.txt";
const bufferSize = 16 * 1024 * 1024; // 16MB buffer

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const kb = bytes / 1024;
	if (kb < 1024) return `${kb.toFixed(2)} KB`;
	const mb = kb / 1024;
	if (mb < 1024) return `${mb.toFixed(2)} MB`;
	const gb = mb / 1024;
	return `${gb.toFixed(2)} GB`;
}

function printMemStats(trie: Seshat): void {
	const memStats = trie.getMemoryStats();
	const formattedMemStats: Record<string, string | number> = {};
	for (const key of Object.keys(memStats) as Array<keyof typeof memStats>) {
		const value = memStats[key];
		formattedMemStats[key] = typeof value === "number" ? formatBytes(value) : value;
	}
	console.log("Memory Stats:", JSON.stringify(formattedMemStats, null, 2));
	console.log(`Node count: ${memStats.nodeCount}`);
}

async function run() {
	// --- File insertion ---
	console.log("\n--- insertFromFile ---");
	const trie = new Seshat();
	const start = performance.now();
	const wordsInserted = trie.insertFromFile(filePath, bufferSize);
	const end = performance.now();
	console.log(`Words inserted: ${wordsInserted}`);
	console.log(`Time taken: ${(end - start).toFixed(2)} ms`);
	console.log(`bufferSize: ${bufferSize} bytes`);
	printMemStats(trie);

	// --- JSON export ---
	console.log("\n--- JSON serialization ---");
	const exportPath = "./trie-export.json";
	const exportStart = performance.now();
	const trieJson = trie.toJSON();
	writeFileSync(exportPath, JSON.stringify(trieJson));
	const exportEnd = performance.now();
	console.log(`Export to JSON time: ${(exportEnd - exportStart).toFixed(2)} ms`);

	// --- JSON import ---
	const importStart = performance.now();
	const importedJson = JSON.parse(readFileSync(exportPath, "utf8"));
	const importedTrie = Seshat.fromJSON(importedJson);
	const importEnd = performance.now();
	console.log(`Import from JSON time: ${(importEnd - importStart).toFixed(2)} ms`);
	console.log(`Verified word count: ${importedTrie.size()}`);

	// --- Buffer export ---
	console.log("\n--- Buffer serialization ---");
	const bufExportStart = performance.now();
	const buf = trie.toBuffer();
	const bufExportEnd = performance.now();
	console.log(`Export to Buffer time: ${(bufExportEnd - bufExportStart).toFixed(2)} ms`);
	console.log(`Buffer size: ${formatBytes(buf.length)}`);

	// --- Buffer import (fromBuffer) ---
	const bufImportStart = performance.now();
	const restoredTrie = Seshat.fromBuffer(buf);
	const bufImportEnd = performance.now();
	console.log(`Import from Buffer time: ${(bufImportEnd - bufImportStart).toFixed(2)} ms`);
	console.log(`Verified word count: ${restoredTrie.size()}`);

	// --- insertFromBuffer (raw) ---
	console.log("\n--- insertFromBuffer ---");
	const rawBufTrie = new Seshat();
	const rawBufStart = performance.now();
	const rawBufCount = rawBufTrie.insertFromBuffer(buf);
	const rawBufEnd = performance.now();
	console.log(`Words inserted: ${rawBufCount}`);
	console.log(`Time taken: ${(rawBufEnd - rawBufStart).toFixed(2)} ms`);

	// --- insertFromStream ---
	console.log("\n--- insertFromStream ---");
	const streamTrie = new Seshat();
	const streamStart = performance.now();
	const streamCount = await streamTrie.insertFromStream(createReadStream(filePath));
	const streamEnd = performance.now();
	console.log(`Words inserted: ${streamCount}`);
	console.log(`Time taken: ${(streamEnd - streamStart).toFixed(2)} ms`);

	// --- Summary ---
	console.log("\n--- Summary ---");
	console.log(`${"Method".padEnd(28)} ${"Time (ms)".padStart(12)} ${"Words".padStart(10)}`);
	console.log("-".repeat(52));
	console.log(`${"insertFromFile".padEnd(28)} ${(end - start).toFixed(2).padStart(12)} ${wordsInserted.toString().padStart(10)}`);
	console.log(`${"insertFromBuffer".padEnd(28)} ${(rawBufEnd - rawBufStart).toFixed(2).padStart(12)} ${rawBufCount.toString().padStart(10)}`);
	console.log(`${"insertFromStream".padEnd(28)} ${(streamEnd - streamStart).toFixed(2).padStart(12)} ${streamCount.toString().padStart(10)}`);
	console.log(`${"JSON export".padEnd(28)} ${(exportEnd - exportStart).toFixed(2).padStart(12)}`);
	console.log(`${"JSON import".padEnd(28)} ${(importEnd - importStart).toFixed(2).padStart(12)} ${importedTrie.size().toString().padStart(10)}`);
	console.log(`${"Buffer export (toBuffer)".padEnd(28)} ${(bufExportEnd - bufExportStart).toFixed(2).padStart(12)}`);
	console.log(`${"Buffer import (fromBuffer)".padEnd(28)} ${(bufImportEnd - bufImportStart).toFixed(2).padStart(12)} ${restoredTrie.size().toString().padStart(10)}`);
}

run().catch(console.error);
