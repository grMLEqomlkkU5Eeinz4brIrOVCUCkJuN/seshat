import { Seshat } from "../lib/index";

interface BenchmarkResult {
	test: string;
	runs: number[];
	mean: number;
	median: number;
	stdDev: number;
	min: number;
	max: number;
	coefficientOfVariation: number;
}

class StableBenchmark {
	private name: string;
	private results: BenchmarkResult[] = [];

	constructor(name: string) {
		this.name = name;
	}

	// Warm up the JIT compiler and stabilize system state
	private warmUp(fn: () => void, iterations: number = 100): void {
		console.log("  Warming up...");
		for (let i = 0; i < iterations; i++) {
			fn();
		}
		// Force garbage collection if available
		if (global.gc) {
			global.gc();
		}
		// Brief pause to let system stabilize
		const start = Date.now();
		while (Date.now() - start < 100) {
			// Wait 100ms
		}
	}

	// Run multiple iterations and collect statistics
	timeStable(testName: string, fn: () => void,
		warmupIterations: number = 50,
		measurementRuns: number = 50,
		iterationsPerRun: number = 1000): void {

		console.log(`  Running: ${testName}`);

		// Warm up the JIT
		this.warmUp(fn, warmupIterations);

		const runs: number[] = [];

		for (let run = 0; run < measurementRuns; run++) {
			// Brief stabilization between runs
			if (global.gc) global.gc();

			const start = process.hrtime.bigint();
			for (let i = 0; i < iterationsPerRun; i++) {
				fn();
			}
			const end = process.hrtime.bigint();

			const durationMs = Number(end - start) / 1000000;
			const opsPerSec = (iterationsPerRun * 1000) / durationMs;
			runs.push(opsPerSec);
		}

		// Calculate statistics
		runs.sort((a, b) => a - b);
		const mean = runs.reduce((a, b) => a + b, 0) / runs.length;
		const median = runs[Math.floor(runs.length / 2)];
		const variance = runs.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / runs.length;
		const stdDev = Math.sqrt(variance);
		const coefficientOfVariation = (stdDev / mean) * 100;

		this.results.push({
			test: testName,
			runs,
			mean,
			median,
			min: runs[0],
			max: runs[runs.length - 1],
			stdDev,
			coefficientOfVariation
		});
	}

	printResults(): void {
		console.log(`\n=== ${this.name} ===`);
		console.log("Test Name".padEnd(25) +
			"Mean Ops/sec".padEnd(15) +
			"Median".padEnd(12) +
			"CV%".padEnd(8) +
			"Range".padEnd(20));
		console.log("-".repeat(80));

		this.results.forEach(result => {
			const rangeStr = `${Math.round(result.min)}-${Math.round(result.max)}`;
			console.log(
				result.test.padEnd(25) +
				Math.round(result.mean).toLocaleString().padEnd(15) +
				Math.round(result.median).toLocaleString().padEnd(12) +
				result.coefficientOfVariation.toFixed(1).padEnd(8) +
				rangeStr.padEnd(20)
			);
		});
	}

	// Export detailed results for analysis
	getDetailedResults(): BenchmarkResult[] {
		return this.results;
	}
}

function runStableBenchmarks(): void {
	console.log("Seshat Stable Performance Benchmarks");
	console.log("=====================================");
	console.log("Using multiple runs with warm-up and statistical analysis");
	console.log("CV% = Coefficient of Variation (lower is more stable)");

	// Core operations benchmark

	// Analytics methods stable benchmarks
	const trie = new Seshat();
	["hello", "world", "test", "helmet", "helpful", "apple", "banana", "carrot"].forEach(word => trie.insert(word));

	const analyticsBench = new StableBenchmark("Analytics Methods");
	analyticsBench.timeStable("getHeightStats", () => trie.getHeightStats(), 10, 10, 100);
	analyticsBench.timeStable("getMemoryStats", () => trie.getMemoryStats(), 10, 10, 100);
	analyticsBench.timeStable("getWordMetrics", () => trie.getWordMetrics(), 10, 10, 100);
	analyticsBench.timeStable("patternSearch('*a*')", () => trie.patternSearch("*a*"), 10, 10, 100);
	analyticsBench.printResults();
	const coreBench = new StableBenchmark("Core Operations");

	// Single insert
	coreBench.timeStable("Insert", () => {
		const trie = new Seshat();
		trie.insert("testword");
	}, 50, 15, 1000);

	// Single search (existing)
	const setupTrie = new Seshat();
	setupTrie.insert("testword");
	coreBench.timeStable("Search (hit)", () => {
		setupTrie.search("testword");
	}, 50, 15, 1000);

	// Single search (miss)
	coreBench.timeStable("Search (miss)", () => {
		setupTrie.search("missing");
	}, 50, 15, 1000);

	coreBench.printResults();

	// Batch operations benchmark
	const batchBench = new StableBenchmark("Batch vs Individual");

	const testWords = Array.from({ length: 100 }, (_, i) => `word${i}`);

	// Individual insertions
	batchBench.timeStable("Individual Insert 100", () => {
		const trie = new Seshat();
		testWords.forEach(word => trie.insert(word));
	}, 20, 10, 10);

	// Batch insertions
	batchBench.timeStable("Batch Insert 100", () => {
		const trie = new Seshat();
		trie.insertBatch(testWords);
	}, 20, 10, 10);

	// Setup for search tests
	const searchTrie = new Seshat();
	searchTrie.insertBatch(testWords);

	// Individual searches
	batchBench.timeStable("Individual Search 100", () => {
		testWords.forEach(word => searchTrie.search(word));
	}, 20, 10, 10);

	// Batch searches
	batchBench.timeStable("Batch Search 100", () => {
		searchTrie.searchBatch(testWords);
	}, 20, 10, 10);

	batchBench.printResults();

	// System load test - detect if system is under stress
	const systemBench = new StableBenchmark("System Stability Check");

	// Simple CPU-bound operation repeated
	systemBench.timeStable("CPU Stability", () => {
		let sum = 0;
		for (let i = 0; i < 1000; i++) {
			sum += Math.sqrt(i);
		}
	}, 30, 20, 100);

	systemBench.printResults();

	// Print analysis
	console.log("\n=== Variance Analysis ===");
	console.log("CV% < 5%:  Excellent stability");
	console.log("CV% 5-10%: Good stability");
	console.log("CV% 10-20%: Moderate variance");
	console.log("CV% > 20%: High variance (system load/thermal throttling)");

	// Check for high variance and provide recommendations
	const allResults = [
		...coreBench.getDetailedResults(),
		...batchBench.getDetailedResults(),
		...systemBench.getDetailedResults()
	];

	const highVarianceTests = allResults.filter(r => r.coefficientOfVariation > 15);
	if (highVarianceTests.length > 0) {
		console.log("\nHigh Variance Detected:");
		highVarianceTests.forEach(test => {
			console.log(`  - ${test.test}: ${test.coefficientOfVariation.toFixed(1)}% CV`);
		});

		console.log("\nRecommendations:");
		console.log("  1. Close unnecessary applications");
		console.log("  2. Ensure laptop is plugged in (not on battery)");
		console.log("  3. Set Windows power plan to 'High Performance'");
		console.log("  4. Run: node --expose-gc benchmark/stable-benchmark.ts");
		console.log("  5. Let laptop cool down if warm");
	} else {
		console.log("\nSystem appears stable for benchmarking");
	}
}

if (require.main === module) {
	runStableBenchmarks();
}

export { StableBenchmark };