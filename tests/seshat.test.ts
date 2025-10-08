import { Seshat } from "../lib/index";
import fs from "fs";
import os from "os";

describe("Seshat", () => {
	let trie: Seshat;

	beforeEach(() => {
		trie = new Seshat();
	});

	describe("Constructor and Basic Setup", () => {
		test("should create an empty trie by default", () => {
			expect(trie.isEmpty()).toBe(true);
			expect(trie.size()).toBe(0);
		});

		test("should create trie with initial words", () => {
			const words = ["hello", "world", "test"];
			const trieWithWords = new Seshat({ words });

			expect(trieWithWords.size()).toBe(3);
			expect(trieWithWords.search("hello")).toBe(true);
			expect(trieWithWords.search("world")).toBe(true);
			expect(trieWithWords.search("test")).toBe(true);
		});

		test("should create trie with case insensitive option", () => {
			const trieCaseInsensitive = new Seshat({ ignoreCase: true });
			trieCaseInsensitive.insert("Hello");

			expect(trieCaseInsensitive.search("hello")).toBe(true);
			expect(trieCaseInsensitive.search("HELLO")).toBe(true);
			expect(trieCaseInsensitive.search("HeLLo")).toBe(true);
		});
	});

	describe("Insert Operations", () => {
		test("should insert a single word", () => {
			trie.insert("hello");

			expect(trie.search("hello")).toBe(true);
			expect(trie.size()).toBe(1);
			expect(trie.isEmpty()).toBe(false);
		});

		test("should insert multiple words", () => {
			["hello", "world", "test"].forEach(word => trie.insert(word));

			expect(trie.size()).toBe(3);
			expect(trie.search("hello")).toBe(true);
			expect(trie.search("world")).toBe(true);
			expect(trie.search("test")).toBe(true);
		});

		test("should not insert duplicate words", () => {
			trie.insert("hello");
			trie.insert("hello");

			expect(trie.size()).toBe(1);
			expect(trie.search("hello")).toBe(true);
		});

		test("should throw error for empty word", () => {
			expect(() => trie.insert("")).toThrow("Word cannot be empty or whitespace only");
			expect(() => trie.insert("   ")).toThrow("Word cannot be empty or whitespace only");
		});

		test("should throw error for non-string input", () => {
			expect(() => trie.insert(null as any)).toThrow("Word cannot be empty or whitespace only");
			expect(() => trie.insert(123 as any)).toThrow("word.trim is not a function");
		});

		test("should handle bulk insertions", () => {
			// Test that individual inserts work
			const largeWordList = Array.from({ length: 1000 }, (_, i) => `word${i}`);

			const start = process.hrtime.bigint();
			largeWordList.forEach(word => trie.insert(word));
			const end = process.hrtime.bigint();
			const duration = Number(end - start) / 1000000; // Convert to milliseconds

			expect(trie.size()).toBe(1000);
			expect(duration).toBeLessThan(100); // Should complete in less than 100ms
		});

		test("should handle large bulk insertions", () => {
			const largeWordList: string[] = [];
			for (let i = 0; i < 1000; i++) {
				largeWordList.push(`word${i}`);
			}

			const start = process.hrtime.bigint();
			largeWordList.forEach(word => trie.insert(word));
			const end = process.hrtime.bigint();
			const duration = Number(end - start) / 1000000; // Convert to milliseconds

			expect(trie.size()).toBe(1000);
			expect(trie.search("word0")).toBe(true);
			expect(trie.search("word999")).toBe(true);
			expect(duration).toBeLessThan(100); // Should complete in less than 100ms
		});

		test("should handle empty array", () => {
			[].forEach(word => trie.insert(word));
			expect(trie.size()).toBe(0);
			expect(trie.isEmpty()).toBe(true);
		});

		test("should throw error for empty strings", () => {
			expect(() => trie.insert("")).toThrow("Word cannot be empty or whitespace only");
			expect(() => trie.insert("   ")).toThrow("Word cannot be empty or whitespace only");
		});
	});

	describe("Search Operations", () => {
		beforeEach(() => {
			["hello", "world", "help", "test"].forEach(word => trie.insert(word));
		});

		test("should find existing words", () => {
			expect(trie.search("hello")).toBe(true);
			expect(trie.search("world")).toBe(true);
			expect(trie.search("help")).toBe(true);
			expect(trie.search("test")).toBe(true);
		});

		test("should not find non-existing words", () => {
			expect(trie.search("hell")).toBe(false);
			expect(trie.search("worlds")).toBe(false);
			expect(trie.search("testing")).toBe(false);
		});

		test("should return false for empty string", () => {
			expect(trie.search("")).toBe(false);
			expect(trie.search("   ")).toBe(false);
		});

		test("should throw error for non-string input", () => {
			expect(() => trie.search(null as any)).toThrow("Word must be a string");
			expect(() => trie.search(123 as any)).toThrow("Word must be a string");
		});
	});

	describe("Prefix Operations", () => {
		beforeEach(() => {
			["hello", "help", "world", "test"].forEach(word => trie.insert(word));
		});

		test("should check if any word starts with prefix", () => {
			expect(trie.startsWith("he")).toBe(true);
			expect(trie.startsWith("hel")).toBe(true);
			expect(trie.startsWith("hello")).toBe(true);
			expect(trie.startsWith("wor")).toBe(true);
			expect(trie.startsWith("test")).toBe(true);
		});

		test("should return false for non-matching prefixes", () => {
			expect(trie.startsWith("xyz")).toBe(false);
			expect(trie.startsWith("abc")).toBe(false);
			expect(trie.startsWith("hellox")).toBe(false);
		});

		test("should return true for empty prefix when trie has words", () => {
			expect(trie.startsWith("")).toBe(true);
		});

		test("should return false for empty prefix when trie is empty", () => {
			const emptyTrie = new Seshat();
			expect(emptyTrie.startsWith("")).toBe(false);
		});

		test("should throw error for non-string prefix", () => {
			expect(() => trie.startsWith(null as any)).toThrow("Prefix must be a string");
			expect(() => trie.startsWith(123 as any)).toThrow("Prefix must be a string");
		});

		test("should get words with prefix", () => {
			const wordsWithHe = trie.getWordsWithPrefix("he");
			expect(wordsWithHe).toContain("hello");
			expect(wordsWithHe).toContain("help");
			expect(wordsWithHe).toHaveLength(2);
		});

		test("should get all words with empty prefix", () => {
			const allWords = trie.getWordsWithPrefix("");
			expect(allWords).toHaveLength(4);
			expect(allWords).toContain("hello");
			expect(allWords).toContain("help");
			expect(allWords).toContain("world");
			expect(allWords).toContain("test");
		});

		test("should return empty array for non-matching prefix", () => {
			const words = trie.getWordsWithPrefix("xyz");
			expect(words).toHaveLength(0);
		});

		test("should throw error for non-string prefix in getWordsWithPrefix", () => {
			expect(() => trie.getWordsWithPrefix(null as any)).toThrow("Prefix must be a string");
			expect(() => trie.getWordsWithPrefix(123 as any)).toThrow("Prefix must be a string");
		});
	});

	describe("Remove Operations", () => {
		beforeEach(() => {
			["hello", "world", "help", "test"].forEach(word => trie.insert(word));
		});

		test("should remove existing word", () => {
			const result = trie.remove("hello");

			expect(result).toBe(true);
			expect(trie.search("hello")).toBe(false);
			expect(trie.size()).toBe(3);
		});

		test("should return false when removing non-existing word", () => {
			const result = trie.remove("xyz");

			expect(result).toBe(false);
			expect(trie.size()).toBe(4);
		});

		test("should return false for empty string", () => {
			const result = trie.remove("");
			expect(result).toBe(false);
		});

		test("should throw error for non-string input", () => {
			expect(() => trie.remove(null as any)).toThrow("Word must be a string");
			expect(() => trie.remove(123 as any)).toThrow("Word must be a string");
		});

		test("should remove multiple words", () => {
			const results = trie.removeMany(["hello", "xyz", "world"]);

			expect(results).toEqual([true, false, true]);
			expect(trie.size()).toBe(2);
			expect(trie.search("hello")).toBe(false);
			expect(trie.search("world")).toBe(false);
			expect(trie.search("help")).toBe(true);
			expect(trie.search("test")).toBe(true);
		});

		test("should throw error for non-array in removeMany", () => {
			expect(() => trie.removeMany(null as any)).toThrow("Words must be an array");
			expect(() => trie.removeMany("not-array" as any)).toThrow("Words must be an array");
		});
	});

	describe("Utility Methods", () => {
		beforeEach(() => {
			["hello", "world", "test"].forEach(word => trie.insert(word));
		});

		test("should check if trie is empty", () => {
			expect(trie.isEmpty()).toBe(false);

			trie.clear();
			expect(trie.isEmpty()).toBe(true);
		});

		test("should get height statistics", () => {
			const stats = trie.getHeightStats();
			expect(stats.minHeight).toBeGreaterThanOrEqual(1);
			expect(stats.maxHeight).toBeGreaterThanOrEqual(stats.minHeight);
			expect(stats.averageHeight).toBeGreaterThanOrEqual(stats.minHeight);
			expect(Array.isArray(stats.allHeights)).toBe(true);
		});

		test("should get memory statistics", () => {
			const mem = trie.getMemoryStats();
			expect(mem.totalBytes).toBeGreaterThan(0);
			expect(mem.nodeCount).toBeGreaterThan(0);
			expect(mem.stringBytes).toBeGreaterThanOrEqual(0);
			expect(mem.bytesPerWord).toBeGreaterThan(0);
		});

		test("should get word metrics", () => {
			const metrics = trie.getWordMetrics();
			expect(metrics.minLength).toBeGreaterThan(0);
			expect(metrics.maxLength).toBeGreaterThanOrEqual(metrics.minLength);
			expect(metrics.averageLength).toBeGreaterThanOrEqual(metrics.minLength);
			expect(Array.isArray(metrics.lengthDistribution)).toBe(true);
			expect(metrics.totalCharacters).toBeGreaterThan(0);
		});

		test("should find words with patternSearch", () => {
			trie.insert("helpful");
			trie.insert("helmet");
			trie.insert("help");
			const results = trie.patternSearch("he*");
			expect(results).toEqual(expect.arrayContaining(["hello", "help", "helpful", "helmet"]));
			const results2 = trie.patternSearch("h?l*");
			expect(results2).toEqual(expect.arrayContaining(["hello", "help", "helmet"]));
			const results3 = trie.patternSearch("*world*");
			expect(results3).toContain("world");
		});

		test("should get all words", () => {
			const allWords = trie.getWordsWithPrefix("");
			expect(allWords).toHaveLength(3);
			expect(allWords).toContain("hello");
			expect(allWords).toContain("world");
			expect(allWords).toContain("test");
		});

		test("should get size", () => {
			expect(trie.size()).toBe(3);

			trie.insert("new");
			expect(trie.size()).toBe(4);

			trie.remove("hello");
			expect(trie.size()).toBe(3);
		});

		test("should clear all words", () => {
			trie.clear();

			expect(trie.isEmpty()).toBe(true);
			expect(trie.size()).toBe(0);
			expect(trie.getWordsWithPrefix("")).toHaveLength(0);
		});

		test("should get statistics", () => {
			const stats = trie.getStats();

			expect(stats.wordCount).toBe(3);
			expect(stats.isEmpty).toBe(false);
			expect(stats.allWords).toHaveLength(3);
			expect(stats.allWords).toContain("hello");
			expect(stats.allWords).toContain("world");
			expect(stats.allWords).toContain("test");
		});
	});

	describe("Static Methods", () => {
		test("should create trie from words", () => {
			const words = ["hello", "world", "test"];
			const trieFromWords = Seshat.fromWords(words);

			expect(trieFromWords.size()).toBe(3);
			expect(trieFromWords.search("hello")).toBe(true);
			expect(trieFromWords.search("world")).toBe(true);
			expect(trieFromWords.search("test")).toBe(true);
		});

		test("should create trie from words with options", () => {
			const words = ["Hello", "World"];
			const trieFromWords = Seshat.fromWords(words, { ignoreCase: true });

			expect(trieFromWords.search("hello")).toBe(true);
			expect(trieFromWords.search("WORLD")).toBe(true);
		});

		test("should convert to JSON", () => {
			["hello", "world"].forEach(word => trie.insert(word));
			const json = trie.toJSON();

			expect(json.words).toContain("hello");
			expect(json.words).toContain("world");
			expect(json.options.ignoreCase).toBe(false);
		});

		test("should create from JSON", () => {
			const originalTrie = new Seshat({ words: ["hello", "world"], ignoreCase: true });
			const json = originalTrie.toJSON();
			const newTrie = Seshat.fromJSON(json);

			expect(newTrie.size()).toBe(2);
			expect(newTrie.search("hello")).toBe(true);
			expect(newTrie.search("world")).toBe(true);
			expect(newTrie.search("HELLO")).toBe(true); // Case insensitive
		});
	});

	describe("Case Sensitivity", () => {
		test("should be case sensitive by default", () => {
			trie.insert("Hello");

			expect(trie.search("Hello")).toBe(true);
			expect(trie.search("hello")).toBe(false);
			expect(trie.search("HELLO")).toBe(false);
		});

		test("should be case insensitive when option is set", () => {
			const caseInsensitiveTrie = new Seshat({ ignoreCase: true });
			caseInsensitiveTrie.insert("Hello");

			expect(caseInsensitiveTrie.search("Hello")).toBe(true);
			expect(caseInsensitiveTrie.search("hello")).toBe(true);
			expect(caseInsensitiveTrie.search("HELLO")).toBe(true);
			expect(caseInsensitiveTrie.search("HeLLo")).toBe(true);
		});

		test("should handle case insensitive prefix search", () => {
			const caseInsensitiveTrie = new Seshat({ ignoreCase: true });
			["Hello", "Help", "World"].forEach(word => caseInsensitiveTrie.insert(word));

			expect(caseInsensitiveTrie.startsWith("he")).toBe(true);
			expect(caseInsensitiveTrie.startsWith("HE")).toBe(true);

			const words = caseInsensitiveTrie.getWordsWithPrefix("he");
			expect(words).toHaveLength(2);
		});
	});

	describe("Edge Cases", () => {
		test("should handle single character words", () => {
			trie.insert("a");
			trie.insert("b");

			expect(trie.search("a")).toBe(true);
			expect(trie.search("b")).toBe(true);
			expect(trie.size()).toBe(2);
		});

		test("should handle very long words", () => {
			const longWord = "a".repeat(1000);
			trie.insert(longWord);

			expect(trie.search(longWord)).toBe(true);
			expect(trie.size()).toBe(1);
		});

		test("should handle special characters", () => {
			["hello-world", "test@example.com", "user123", "test 123"].forEach(word => trie.insert(word));

			expect(trie.search("hello-world")).toBe(true);
			expect(trie.search("test@example.com")).toBe(true);
			expect(trie.search("user123")).toBe(true);
			expect(trie.search("test 123")).toBe(true);
		});

		test("should handle unicode characters", () => {
			["café", "naïve", "résumé"].forEach(word => trie.insert(word));

			expect(trie.search("café")).toBe(true);
			expect(trie.search("naïve")).toBe(true);
			expect(trie.search("résumé")).toBe(true);
		});

		test("should distinguish cafe vs café (unicode)", () => {
			trie.insert("café");

			expect(trie.search("cafe")).toBe(false);
			expect(trie.search("café")).toBe(true);

		});

		test("should distinguish cafe vs cafe\u0301 (combining acute)", () => {
			trie.insert("cafe");
			const cafeCombining = "cafe\u0301"; // 'e' + combining acute accent
			expect(trie.search(cafeCombining)).toBe(false);
		});
	});

	describe("Bulk Insertion Tests", () => {
		test("should handle words with no common prefix", () => {
			// Test the specific case that was causing overwriting issues
			const trie = new Seshat();
			["cat", "dog", "bird", "fish"].forEach(word => trie.insert(word));

			expect(trie.size()).toBe(4);
			expect(trie.search("cat")).toBe(true);
			expect(trie.search("dog")).toBe(true);
			expect(trie.search("bird")).toBe(true);
			expect(trie.search("fish")).toBe(true);

			// Verify all words are accessible
			const allWords = trie.getWordsWithPrefix("").sort();
			expect(allWords).toEqual(["bird", "cat", "dog", "fish"]);
		});

		test("should handle mixed common prefixes and unique words", () => {
			const trie = new Seshat();
			["car", "card", "care", "cat", "dog", "door"].forEach(word => trie.insert(word));

			expect(trie.size()).toBe(6);

			// Test common prefix "car"
			expect(trie.getWordsWithPrefix("car")).toEqual(expect.arrayContaining(["car", "card", "care"]));

			// Test unique words
			expect(trie.search("cat")).toBe(true);
			expect(trie.search("dog")).toBe(true);
			expect(trie.search("door")).toBe(true);

			// Verify all words are present
			const allWords = trie.getWordsWithPrefix("").sort();
			expect(allWords).toEqual(expect.arrayContaining(["car", "card", "care", "cat", "dog", "door"]));
			expect(allWords).toHaveLength(6);
		});

		test("should handle complex prefix scenarios", () => {
			const trie = new Seshat();
			["a", "aa", "aaa", "aaaa", "aaaaa", "b", "bb", "bbb"].forEach(word => trie.insert(word));

			expect(trie.size()).toBe(8);

			// Test various prefix lengths
			expect(trie.getWordsWithPrefix("a")).toEqual(expect.arrayContaining(["a", "aa", "aaa", "aaaa", "aaaaa"]));
			expect(trie.getWordsWithPrefix("aa")).toEqual(expect.arrayContaining(["aa", "aaa", "aaaa", "aaaaa"]));
			expect(trie.getWordsWithPrefix("aaa")).toEqual(expect.arrayContaining(["aaa", "aaaa", "aaaaa"]));
			expect(trie.getWordsWithPrefix("b")).toEqual(expect.arrayContaining(["b", "bb", "bbb"]));

			// Verify all words are present
			const allWords = trie.getWordsWithPrefix("").sort();
			expect(allWords).toEqual(["a", "aa", "aaa", "aaaa", "aaaaa", "b", "bb", "bbb"]);
		});

		test("should handle large dataset with mixed patterns", () => {
			const words: string[] = [];

			// Add words with common prefixes
			for (let i = 0; i < 100; i++) {
				words.push(`prefix${i.toString().padStart(3, "0")}`);
			}

			// Add unique words
			for (let i = 0; i < 50; i++) {
				words.push(`unique${i.toString().padStart(3, "0")}`);
			}
			// Add words with no common prefix
			words.push("a", "b", "c", "d", "e");

			const trie = new Seshat();
			words.forEach(word => trie.insert(word));
			expect(trie.size()).toBe(155);

			// Test prefix search
			const prefixWords = trie.getWordsWithPrefix("prefix");
			expect(prefixWords).toHaveLength(100);

			const uniqueWords = trie.getWordsWithPrefix("unique");
			expect(uniqueWords).toHaveLength(50);

			// Test individual unique words
			expect(trie.search("a")).toBe(true);
			expect(trie.search("b")).toBe(true);
			expect(trie.search("c")).toBe(true);
			expect(trie.search("d")).toBe(true);
			expect(trie.search("e")).toBe(true);
		});
	});

	describe("Orphaned Node Cleanup Tests", () => {
		test("should clean up orphaned nodes after removal", () => {
			const trie = new Seshat();

			// Insert words that will create a specific tree structure
			["hello", "help", "world"].forEach(word => trie.insert(word));
			expect(trie.size()).toBe(3);

			// Remove "hello" - this should clean up orphaned nodes
			const removed = trie.remove("hello");
			expect(removed).toBe(true);
			expect(trie.size()).toBe(2);

			// Verify "help" and "world" are still accessible
			expect(trie.search("help")).toBe(true);
			expect(trie.search("world")).toBe(true);
			expect(trie.search("hello")).toBe(false);

			// Verify prefix search still works
			expect(trie.getWordsWithPrefix("he")).toEqual(["help"]);
			expect(trie.getWordsWithPrefix("wo")).toEqual(["world"]);
		});

		test("should clean up orphaned nodes in complex tree structure", () => {
			const trie = new Seshat();

			// Create a more complex tree structure
			["car", "card", "care", "careful", "cat", "dog"].forEach(word => trie.insert(word));
			expect(trie.size()).toBe(6);

			// Remove "care" - should clean up orphaned nodes
			const removed = trie.remove("care");
			expect(removed).toBe(true);
			expect(trie.size()).toBe(5);

			// Verify remaining words are still accessible
			expect(trie.search("car")).toBe(true);
			expect(trie.search("card")).toBe(true);
			expect(trie.search("careful")).toBe(true);
			expect(trie.search("cat")).toBe(true);
			expect(trie.search("dog")).toBe(true);
			expect(trie.search("care")).toBe(false);

			// Verify prefix searches still work
			expect(trie.getWordsWithPrefix("car")).toEqual(expect.arrayContaining(["car", "card", "careful"]));
			expect(trie.getWordsWithPrefix("ca")).toEqual(expect.arrayContaining(["car", "card", "careful", "cat"]));
		});

		test("should handle cleanup when removing leaf nodes", () => {
			const trie = new Seshat();

			// Insert words that create a specific tree structure
			["a", "aa", "aaa", "aaaa"].forEach(word => trie.insert(word));
			expect(trie.size()).toBe(4);

			// Remove the longest word first
			const removed = trie.remove("aaaa");
			expect(removed).toBe(true);
			expect(trie.size()).toBe(3);

			// Verify remaining words are still accessible
			expect(trie.search("a")).toBe(true);
			expect(trie.search("aa")).toBe(true);
			expect(trie.search("aaa")).toBe(true);
			expect(trie.search("aaaa")).toBe(false);

			// Remove more words
			trie.remove("aaa");
			expect(trie.size()).toBe(2);

			trie.remove("aa");
			expect(trie.size()).toBe(1);

			// Only "a" should remain
			expect(trie.search("a")).toBe(true);
			expect(trie.getWordsWithPrefix("")).toEqual(["a"]);
		});

		test("should not clean up nodes that are still needed", () => {
			const trie = new Seshat();

			// Insert words that share common prefixes
			["hello", "help", "world"].forEach(word => trie.insert(word));
			expect(trie.size()).toBe(3);

			// Remove "hello" but "help" should still use the "he" prefix
			const removed = trie.remove("hello");
			expect(removed).toBe(true);
			expect(trie.size()).toBe(2);

			// Verify "help" is still accessible and prefix search works
			expect(trie.search("help")).toBe(true);
			expect(trie.getWordsWithPrefix("he")).toEqual(["help"]);

			// Verify the tree structure is still correct
			expect(trie.getWordsWithPrefix("").sort()).toEqual(["help", "world"]);
		});

		test("should handle cleanup with multiple removals", () => {
			const trie = new Seshat();

			// Insert a larger set of words
			["a", "aa", "aaa", "aaaa", "b", "bb", "bbb", "c", "cc", "ccc"].forEach(word => trie.insert(word));
			expect(trie.size()).toBe(10);

			// Remove words in a specific order to test cleanup
			trie.remove("aaaa");
			expect(trie.size()).toBe(9);
			expect(trie.search("aaa")).toBe(true); // Should still exist

			trie.remove("aaa");
			expect(trie.size()).toBe(8);
			expect(trie.search("aa")).toBe(true); // Should still exist

			trie.remove("aa");
			expect(trie.size()).toBe(7);
			expect(trie.search("a")).toBe(true); // Should still exist

			// Remove all "a" words
			trie.remove("a");
			expect(trie.size()).toBe(6);

			// Verify remaining words
			const remainingWords = trie.getWordsWithPrefix("").sort();
			expect(remainingWords).toEqual(["b", "bb", "bbb", "c", "cc", "ccc"]);

			// Verify prefix searches still work
			expect(trie.getWordsWithPrefix("b")).toEqual(["b", "bb", "bbb"]);
			expect(trie.getWordsWithPrefix("c")).toEqual(["c", "cc", "ccc"]);
		});
	});

	describe("Batch Operations", () => {
		describe("insertBatch", () => {
			test("should insert multiple words in batch", () => {
				const words = ["hello", "world", "test", "batch"];
				const count = trie.insertBatch(words);

				expect(count).toBe(4);
				expect(trie.size()).toBe(4);
				expect(trie.search("hello")).toBe(true);
				expect(trie.search("world")).toBe(true);
				expect(trie.search("test")).toBe(true);
				expect(trie.search("batch")).toBe(true);
			});

			test("should handle empty array", () => {
				const count = trie.insertBatch([]);
				expect(count).toBe(0);
				expect(trie.size()).toBe(0);
			});

			test("should filter out invalid words", () => {
				const words = ["hello", "", "world", null, "test", undefined];
				const count = trie.insertBatch(words as any);

				expect(count).toBe(3);
				expect(trie.size()).toBe(3);
				expect(trie.search("hello")).toBe(true);
				expect(trie.search("world")).toBe(true);
				expect(trie.search("test")).toBe(true);
			});

			test("should throw error for non-array input", () => {
				expect(() => trie.insertBatch("not an array" as any)).toThrow("Words must be an array");
			});
		});

		describe("searchBatch", () => {
			beforeEach(() => {
				trie.insertBatch(["hello", "world", "test"]);
			});

			test("should search multiple words in batch", () => {
				const words = ["hello", "world", "missing", "test"];
				const results = trie.searchBatch(words);

				expect(results).toEqual([true, true, false, true]);
			});

			test("should handle empty array", () => {
				const results = trie.searchBatch([]);
				expect(results).toEqual([]);
			});

			test("should handle mixed valid/invalid words", () => {
				const words = ["hello", "", "world", null, "missing"];
				const results = trie.searchBatch(words as any);

				expect(results).toEqual([true, false, true, false, false]);
			});

			test("should throw error for non-array input", () => {
				expect(() => trie.searchBatch("not an array" as any)).toThrow("Words must be an array");
			});
		});

		describe("removeBatch", () => {
			beforeEach(() => {
				trie.insertBatch(["hello", "world", "test", "batch"]);
			});

			test("should remove multiple words in batch", () => {
				const words = ["hello", "world", "missing", "test"];
				const results = trie.removeBatch(words);

				expect(results).toEqual([true, true, false, true]);
				expect(trie.size()).toBe(1);
				expect(trie.search("batch")).toBe(true);
			});

			test("should handle empty array", () => {
				const results = trie.removeBatch([]);
				expect(results).toEqual([]);
				expect(trie.size()).toBe(4);
			});

			test("should handle mixed valid/invalid words", () => {
				const words = ["hello", "", "world", null, "missing"];
				const results = trie.removeBatch(words as any);

				expect(results).toEqual([true, false, true, false, false]);
				expect(trie.size()).toBe(2);
			});

			test("should throw error for non-array input", () => {
				expect(() => trie.removeBatch("not an array" as any)).toThrow("Words must be an array");
			});
		});

		describe("Batch Performance", () => {
			test("batch operations should be faster than individual operations", () => {
				const words = Array.from({ length: 100 }, (_, i) => `word${i}`);

				// Individual operations
				const trie1 = new Seshat();
				const start1 = process.hrtime.bigint();
				for (const word of words) {
					trie1.insert(word);
				}
				const end1 = process.hrtime.bigint();
				const individualTime = Number(end1 - start1);

				// Batch operations
				const trie2 = new Seshat();
				const start2 = process.hrtime.bigint();
				trie2.insertBatch(words);
				const end2 = process.hrtime.bigint();
				const batchTime = Number(end2 - start2);

				// Batch should be faster (or at least not much slower)
				expect(batchTime).toBeLessThanOrEqual(individualTime * 1.5); // Allow some variance
				expect(trie1.size()).toBe(trie2.size());
			});
		});

		const hasEnable1File = fs.existsSync("./textfiles/enable1.txt");
		(hasEnable1File ? describe : describe.skip)("File Streaming Operations", () => {
			describe("insertFromFile", () => {
				test("should insert words from enable1.txt with 1KB buffer", () => {
					const trie = new Seshat();
					const filePath = "./textfiles/enable1.txt";
					const bufferSize = 1024; // 1KB

					// Test file streaming insertion
					const wordsInserted = trie.insertFromFile(filePath, bufferSize);

					// enable1.txt typically contains around 172,820 words
					expect(wordsInserted).toBeGreaterThan(170000);
					expect(wordsInserted).toBeLessThan(175000);
					expect(trie.size()).toBe(wordsInserted);

					// Test some known words from enable1.txt
					expect(trie.search("hello")).toBe(true);
					expect(trie.search("world")).toBe(true);
					expect(trie.search("test")).toBe(true);
					expect(trie.search("the")).toBe(true);
					expect(trie.search("programming")).toBe(true);

					// Test that non-existent words return false
					expect(trie.search("nonexistentword12345")).toBe(false);
					expect(trie.search("")).toBe(false);
				});

				test("should handle different buffer sizes", () => {
					const trie1 = new Seshat();
					const trie2 = new Seshat();
					const filePath = "./textfiles/enable1.txt";

					// Test with 1KB buffer
					const words1KB = trie1.insertFromFile(filePath, 1024);

					// Test with 4KB buffer
					const words4KB = trie2.insertFromFile(filePath, 4096);

					// Both should insert the same number of words
					expect(words1KB).toBe(words4KB);
					expect(trie1.size()).toBe(trie2.size());

					// Verify both tries have the same content
					expect(trie1.search("hello")).toBe(trie2.search("hello"));
					expect(trie1.search("programming")).toBe(trie2.search("programming"));
				});

				test("should use default buffer size when not specified", () => {
					const trie = new Seshat();
					const filePath = "./textfiles/enable1.txt";

					// Test without specifying buffer size (should use default)
					const wordsInserted = trie.insertFromFile(filePath);

					expect(wordsInserted).toBeGreaterThan(170000);
					expect(trie.size()).toBe(wordsInserted);
					expect(trie.search("hello")).toBe(true);
				});

				test("should throw error for non-existent file", () => {
					const trie = new Seshat();
					const nonExistentPath = "./non-existent-file.txt";

					expect(() => {
						trie.insertFromFile(nonExistentPath, 1024);
					}).toThrow("Failed to insert from file");
				});

				test("should throw error for invalid file path", () => {
					const trie = new Seshat();

					expect(() => {
						trie.insertFromFile(null as any, 1024);
					}).toThrow("File path must be a string");

					expect(() => {
						trie.insertFromFile(123 as any, 1024);
					}).toThrow("File path must be a string");
				});

				test("should throw error for invalid buffer size", () => {
					const trie = new Seshat();
					const filePath = "./textfiles/enable1.txt";

					expect(() => {
						trie.insertFromFile(filePath, 0);
					}).toThrow("Buffer size must be a positive number");

					expect(() => {
						trie.insertFromFile(filePath, -1024);
					}).toThrow("Buffer size must be a positive number");

					expect(() => {
						trie.insertFromFile(filePath, "invalid" as any);
					}).toThrow("Buffer size must be a positive number");
				});

				test("should handle case insensitive file insertion", () => {
					const trie = new Seshat({ ignoreCase: true });
					const filePath = "./textfiles/enable1.txt";
					const bufferSize = 1024;

					const wordsInserted = trie.insertFromFile(filePath, bufferSize);

					expect(wordsInserted).toBeGreaterThan(170000);

					// Test case insensitive search
					expect(trie.search("HELLO")).toBe(true);
					expect(trie.search("hello")).toBe(true);
					expect(trie.search("Hello")).toBe(true);
					expect(trie.search("WORLD")).toBe(true);
					expect(trie.search("world")).toBe(true);
				});

				test("should handle file streaming performance", () => {
					const trie = new Seshat();
					const filePath = "./textfiles/enable1.txt";
					const bufferSize = 1024;

					const start = process.hrtime.bigint();
					const wordsInserted = trie.insertFromFile(filePath, bufferSize);
					const end = process.hrtime.bigint();

					const duration = Number(end - start) / 1000000; // Convert to milliseconds

					expect(wordsInserted).toBeGreaterThan(170000);
					expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds

					console.log(`File streaming inserted ${wordsInserted} words in ${duration.toFixed(2)}ms`);
				});

				test("should handle prefix operations after file insertion", () => {
					const trie = new Seshat();
					const filePath = "./textfiles/enable1.txt";
					const bufferSize = 1024;

					trie.insertFromFile(filePath, bufferSize);

					// Test prefix operations work correctly
					expect(trie.startsWith("he")).toBe(true);
					expect(trie.startsWith("xyz")).toBe(false);

					const wordsWithPre = trie.getWordsWithPrefix("pre");
					expect(wordsWithPre.length).toBeGreaterThan(0);
					expect(wordsWithPre).toContain("present");

					// Test getting all words still works (though it will be a large array)
					const allWords = trie.getWordsWithPrefix("");
					expect(allWords.length).toBeGreaterThan(170000);
				});

				test("should handle removal operations after file insertion", () => {
					const trie = new Seshat();
					const filePath = "./textfiles/enable1.txt";
					const bufferSize = 1024;

					const originalCount = trie.insertFromFile(filePath, bufferSize);

					// Test removing some words
					expect(trie.remove("hello")).toBe(true);
					expect(trie.remove("world")).toBe(true);
					expect(trie.remove("thisworddefinitelydoesnotexist")).toBe(false);

					expect(trie.size()).toBe(originalCount - 2);
					expect(trie.search("hello")).toBe(false);
					expect(trie.search("world")).toBe(false);
				});

				test("should handle very small buffer sizes", () => {
					const trie = new Seshat();
					const filePath = "./textfiles/enable1.txt";
					const bufferSize = 64; // Very small buffer

					const wordsInserted = trie.insertFromFile(filePath, bufferSize);

					// Should still work correctly with small buffer
					expect(wordsInserted).toBeGreaterThan(170000);
					expect(trie.search("hello")).toBe(true);
					expect(trie.search("programming")).toBe(true);
				});
			});
		});
	});
});

describe("Async File Insertion", () => {
    test("should insert words from file asynchronously", done => {
        const tmpFile = fs.mkdtempSync(`${os.tmpdir()}${require('path').sep}seshat-`) + require('path').sep + "words.txt";

        // Ensure directory exists and write file
        fs.mkdirSync(require('path').dirname(tmpFile), { recursive: true });
        const contents = ["alpha", "beta", "gamma", "delta"].join("\n") + "\n";
        fs.writeFileSync(tmpFile, contents, "utf8");

        const t = new Seshat();
        t.insertFromFileAsync(tmpFile, 1024, (err, count) => {
            try {
                expect(err).toBeNull();
                expect(count).toBe(4);
                expect(t.size()).toBe(4);
                expect(t.search("alpha")).toBe(true);
                expect(t.search("beta")).toBe(true);
                expect(t.search("gamma")).toBe(true);
                expect(t.search("delta")).toBe(true);
                done();
            } catch (e) {
                done(e);
            } finally {
                try { fs.unlinkSync(tmpFile); } catch {}
            }
        });
    });
});
